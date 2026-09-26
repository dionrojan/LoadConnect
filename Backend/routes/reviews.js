import express from 'express';
import { db } from '../db/setup.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews - Leave a review after booking is delivered
router.post('/', authenticateToken, (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || rating === undefined) {
      return res.status(400).json({ error: 'booking_id and rating are required' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    const booking = db.prepare(`
      SELECT b.id, b.status, b.merchant_id, t.driver_id
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      WHERE b.id = ?
    `).get(booking_id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'delivered') {
      return res.status(400).json({
        error: `Reviews can only be submitted after delivery is complete (current status: ${booking.status})`
      });
    }

    const isDriver = booking.driver_id === req.user.id;
    const isMerchant = booking.merchant_id === req.user.id;

    if (!isDriver && !isMerchant) {
      return res.status(403).json({ error: 'You are not a participant in this booking' });
    }

    // Determine reviewee (the other party)
    const revieweeId = isDriver ? booking.merchant_id : booking.driver_id;

    // Check if already reviewed
    const existing = db.prepare(`
      SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?
    `).get(booking_id, req.user.id);

    if (existing) {
      return res.status(409).json({ error: 'You have already submitted a review for this booking' });
    }

    const reviewTransaction = db.transaction(() => {
      // 1. Insert review
      const stmt = db.prepare(`
        INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(booking_id, req.user.id, revieweeId, ratingNum, comment ? comment.trim() : null);

      // 2. Recalculate average rating & review count for reviewee
      const stats = db.prepare(`
        SELECT COUNT(*) as count, AVG(rating) as avg
        FROM reviews
        WHERE reviewee_id = ?
      `).get(revieweeId);

      const newAvg = stats.avg ? Math.round(stats.avg * 10) / 10 : 0;
      const newCount = stats.count || 0;

      db.prepare(`
        UPDATE users 
        SET avg_rating = ?, total_reviews = ?
        WHERE id = ?
      `).run(newAvg, newCount, revieweeId);

      return { newAvg, newCount };
    });

    const { newAvg, newCount } = reviewTransaction();

    const createdReview = db.prepare(`
      SELECT r.*, u.name as reviewer_name, u.role as reviewer_role
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.booking_id = ? AND r.reviewer_id = ?
    `).get(booking_id, req.user.id);

    return res.status(201).json({
      message: 'Review submitted successfully',
      review: createdReview,
      reviewee_stats: { avg_rating: newAvg, total_reviews: newCount }
    });
  } catch (err) {
    console.error('Submit review error:', err);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

// GET /api/reviews/user/:userId - Get all reviews for a specific user
router.get('/user/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = db.prepare(`
      SELECT 
        r.id, r.booking_id, r.rating, r.comment, r.created_at,
        u.name as reviewer_name, u.role as reviewer_role
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `).all(userId);

    const user = db.prepare(`
      SELECT id, name, role, avg_rating, total_reviews
      FROM users WHERE id = ?
    `).get(userId);

    return res.json({
      user,
      reviews
    });
  } catch (err) {
    console.error('Get reviews error:', err);
    return res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

export default router;
