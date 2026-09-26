import express from 'express';
import { db } from '../db/setup.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/bookings - Merchant requests space on a trip
router.post('/', authenticateToken, requireRole('merchant'), (req, res) => {
  try {
    const { trip_id, space_requested, pickup_address } = req.body;

    if (!trip_id || space_requested === undefined) {
      return res.status(400).json({ error: 'trip_id and space_requested are required' });
    }

    const spaceNum = parseFloat(space_requested);
    if (isNaN(spaceNum) || spaceNum <= 0) {
      return res.status(400).json({ error: 'space_requested must be greater than 0' });
    }

    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip_id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'active') {
      return res.status(400).json({ error: `Cannot book trip with status "${trip.status}"` });
    }

    if (spaceNum > trip.available_space) {
      return res.status(400).json({
        error: `Requested space (${spaceNum}) exceeds available space (${trip.available_space})`
      });
    }

    // Check for existing pending/accepted booking on this trip by this merchant
    const existing = db.prepare(`
      SELECT id, status FROM bookings 
      WHERE trip_id = ? AND merchant_id = ? AND status IN ('requested', 'accepted', 'picked_up')
    `).get(trip_id, req.user.id);

    if (existing) {
      return res.status(409).json({
        error: `You already have an active booking (${existing.status}) for this trip`
      });
    }

    // Default to merchant's profile business_address if not custom specified
    const merchantUser = db.prepare('SELECT business_address FROM users WHERE id = ?').get(req.user.id);
    const resolvedPickup = (pickup_address && pickup_address.trim()) || merchantUser?.business_address || null;

    const stmt = db.prepare(`
      INSERT INTO bookings (trip_id, merchant_id, space_requested, pickup_address, status)
      VALUES (?, ?, ?, ?, 'requested')
    `);

    const result = stmt.run(trip_id, req.user.id, spaceNum, resolvedPickup);

    const booking = db.prepare(`
      SELECT 
        b.*,
        COALESCE(b.pickup_address, u.business_address) as pickup_location,
        t.origin, t.destination, t.departure_date, t.price_per_unit, t.driver_id,
        u.name as driver_name, u.phone as driver_phone, u.vehicle_type
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN users u ON t.driver_id = u.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Booking request sent to driver',
      booking
    });
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings - List bookings for current user (driver or merchant)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    let query = '';
    const params = [];

    if (req.user.role === 'driver') {
      query = `
        SELECT 
          b.*,
          t.origin, t.destination, t.departure_date, t.price_per_unit, t.available_space,
          m.name as merchant_name, m.phone as merchant_phone, m.business_name, m.business_address,
          COALESCE(b.pickup_address, m.business_address) as pickup_location,
          m.avg_rating as merchant_rating
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN users m ON b.merchant_id = m.id
        WHERE t.driver_id = ?
      `;
      params.push(req.user.id);
    } else {
      query = `
        SELECT 
          b.*,
          t.origin, t.destination, t.departure_date, t.price_per_unit,
          d.name as driver_name, d.phone as driver_phone, d.vehicle_type, d.avg_rating as driver_rating,
          m.name as merchant_name, m.business_name, m.business_address,
          COALESCE(b.pickup_address, m.business_address) as pickup_location
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN users d ON t.driver_id = d.id
        JOIN users m ON b.merchant_id = m.id
        WHERE b.merchant_id = ?
      `;
      params.push(req.user.id);
    }

    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY b.created_at DESC`;

    const bookings = db.prepare(query).all(...params);
    return res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// GET /api/bookings/:id - Single booking details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT 
        b.*,
        t.origin, t.destination, t.departure_date, t.price_per_unit, t.notes as trip_notes, t.driver_id,
        d.name as driver_name, d.phone as driver_phone, d.vehicle_type, d.avg_rating as driver_rating,
        m.name as merchant_name, m.phone as merchant_phone, m.business_name, m.business_address, m.avg_rating as merchant_rating
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN users d ON t.driver_id = d.id
      JOIN users m ON b.merchant_id = m.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.driver_id !== req.user.id && booking.merchant_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    return res.json({ booking });
  } catch (err) {
    console.error('Get booking error:', err);
    return res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status: newStatus } = req.body;
    const bookingId = req.params.id;

    if (!newStatus) {
      return res.status(400).json({ error: 'status is required' });
    }

    const booking = db.prepare(`
      SELECT b.*, t.driver_id, t.available_space, t.total_space
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isDriver = booking.driver_id === req.user.id;
    const isMerchant = booking.merchant_id === req.user.id;

    if (!isDriver && !isMerchant) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    const validTransitions = {
      requested: ['accepted', 'declined'],
      accepted: ['picked_up', 'declined'],
      picked_up: ['delivered'],
      delivered: [],
      declined: []
    };

    // Drivers can accept, decline, pick up, deliver
    // Merchants can cancel if still 'requested'
    if (isMerchant && !isDriver) {
      if (booking.status === 'requested' && newStatus === 'declined') {
        // Merchant withdrawing their request
        db.prepare("UPDATE bookings SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(bookingId);
        return res.json({ message: 'Booking request withdrawn', status: 'declined' });
      } else {
        return res.status(403).json({ error: 'Merchants can only cancel a pending request' });
      }
    }

    // Driver status transitions
    if (!validTransitions[booking.status] || !validTransitions[booking.status].includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition status from "${booking.status}" to "${newStatus}"`
      });
    }

    // Use transaction for space deduction / replenishment
    const updateTransaction = db.transaction(() => {
      if (newStatus === 'accepted') {
        if (booking.available_space < booking.space_requested) {
          throw new Error(`Insufficient space remaining on trip (Available: ${booking.available_space}, Requested: ${booking.space_requested})`);
        }
        db.prepare(`
          UPDATE trips 
          SET available_space = available_space - ? 
          WHERE id = ?
        `).run(booking.space_requested, booking.trip_id);
      } else if (booking.status === 'accepted' && newStatus === 'declined') {
        // Restoring space if an accepted booking gets cancelled
        db.prepare(`
          UPDATE trips 
          SET available_space = MIN(total_space, available_space + ?) 
          WHERE id = ?
        `).run(booking.space_requested, booking.trip_id);
      }

      db.prepare(`
        UPDATE bookings 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(newStatus, bookingId);
    });

    updateTransaction();

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    return res.json({
      message: `Booking status updated to ${newStatus}`,
      booking: updatedBooking
    });
  } catch (err) {
    console.error('Update booking status error:', err);
    return res.status(400).json({ error: err.message || 'Failed to update booking status' });
  }
});

export default router;
