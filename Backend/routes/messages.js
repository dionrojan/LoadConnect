import express from 'express';
import { db } from '../db/setup.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function getBookingAccess(bookingId, userId) {
  const booking = db.prepare(`
    SELECT b.id, b.status, b.merchant_id, t.driver_id
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) return { error: 'Booking not found', status: 404 };

  const isParty = booking.merchant_id === userId || booking.driver_id === userId;
  if (!isParty) return { error: 'Not authorized for this booking', status: 403 };

  // Only allowed if accepted, picked_up, or delivered
  if (!['accepted', 'picked_up', 'delivered'].includes(booking.status)) {
    return {
      error: 'Chat is only available for accepted, picked up, or delivered bookings',
      status: 400
    };
  }

  return { booking };
}

// GET /api/messages/:bookingId - Load message history
router.get('/:bookingId', authenticateToken, (req, res) => {
  try {
    const { bookingId } = req.params;
    const access = getBookingAccess(bookingId, req.user.id);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const messages = db.prepare(`
      SELECT 
        m.id, m.booking_id, m.sender_id, m.content, m.created_at,
        u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.booking_id = ?
      ORDER BY m.created_at ASC
    `).all(bookingId);

    return res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// POST /api/messages/:bookingId - Send message via REST
router.post('/:bookingId', authenticateToken, (req, res) => {
  try {
    const { bookingId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const access = getBookingAccess(bookingId, req.user.id);
    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const stmt = db.prepare(`
      INSERT INTO messages (booking_id, sender_id, content)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(bookingId, req.user.id, content.trim());

    const message = db.prepare(`
      SELECT 
        m.id, m.booking_id, m.sender_id, m.content, m.created_at,
        u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({ message });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
