import express from 'express';
import { db } from '../db/setup.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/trips - Driver posts a new trip
router.post('/', authenticateToken, requireRole('driver'), (req, res) => {
  try {
    const {
      origin,
      destination,
      departure_date,
      total_space,
      price_per_unit,
      notes
    } = req.body;

    if (!origin || !destination || !departure_date || total_space === undefined || price_per_unit === undefined) {
      return res.status(400).json({
        error: 'Origin, destination, departure_date, total_space, and price_per_unit are required'
      });
    }

    const spaceNum = parseFloat(total_space);
    const priceNum = parseFloat(price_per_unit);

    if (isNaN(spaceNum) || spaceNum <= 0) {
      return res.status(400).json({ error: 'total_space must be a positive number' });
    }
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ error: 'price_per_unit must be a non-negative number' });
    }

    const stmt = db.prepare(`
      INSERT INTO trips (
        driver_id, origin, destination, departure_date,
        total_space, available_space, price_per_unit, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      req.user.id,
      origin.trim(),
      destination.trim(),
      departure_date,
      spaceNum,
      spaceNum, // initially available_space = total_space
      priceNum,
      notes ? notes.trim() : null
    );

    const createdTrip = db.prepare(`
      SELECT t.*, u.name as driver_name, u.phone as driver_phone, u.vehicle_type, u.avg_rating, u.total_reviews
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Trip posted successfully',
      trip: createdTrip
    });
  } catch (err) {
    console.error('Create trip error:', err);
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

// GET /api/trips - Search & list trips
router.get('/', authenticateToken, (req, res) => {
  try {
    const {
      origin,
      destination,
      date_from,
      date_to,
      min_space,
      max_price,
      status = 'active',
      driver_id
    } = req.query;

    let query = `
      SELECT t.*, u.name as driver_name, u.phone as driver_phone, u.vehicle_type, u.avg_rating, u.total_reviews
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (driver_id) {
      query += ` AND t.driver_id = ?`;
      params.push(driver_id);
    }

    if (origin) {
      query += ` AND LOWER(t.origin) LIKE ?`;
      params.push(`%${origin.toLowerCase().trim()}%`);
    }

    if (destination) {
      query += ` AND LOWER(t.destination) LIKE ?`;
      params.push(`%${destination.toLowerCase().trim()}%`);
    }

    if (date_from) {
      query += ` AND t.departure_date >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND t.departure_date <= ?`;
      params.push(date_to);
    }

    if (min_space) {
      query += ` AND t.available_space >= ?`;
      params.push(parseFloat(min_space));
    }

    if (max_price) {
      query += ` AND t.price_per_unit <= ?`;
      params.push(parseFloat(max_price));
    }

    query += ` ORDER BY t.departure_date ASC, t.created_at DESC`;

    const trips = db.prepare(query).all(...params);
    return res.json({ trips });
  } catch (err) {
    console.error('Get trips error:', err);
    return res.status(500).json({ error: 'Failed to retrieve trips' });
  }
});

// GET /api/trips/:id - Get trip details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const trip = db.prepare(`
      SELECT t.*, u.name as driver_name, u.phone as driver_phone, u.vehicle_type, u.avg_rating, u.total_reviews
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // If requester is the driver, also attach bookings on this trip
    if (trip.driver_id === req.user.id) {
      const bookings = db.prepare(`
        SELECT b.*, u.name as merchant_name, u.phone as merchant_phone, u.business_name, u.business_address,
               COALESCE(b.pickup_address, u.business_address) as pickup_location,
               u.avg_rating as merchant_rating
        FROM bookings b
        JOIN users u ON b.merchant_id = u.id
        WHERE b.trip_id = ?
        ORDER BY b.created_at DESC
      `).all(trip.id);
      trip.bookings = bookings;
    }

    return res.json({ trip });
  } catch (err) {
    console.error('Get trip error:', err);
    return res.status(500).json({ error: 'Failed to retrieve trip' });
  }
});

// PUT /api/trips/:id - Update trip details (Owner only)
router.put('/:id', authenticateToken, requireRole('driver'), (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this trip' });
    }

    // Check if there are active/accepted bookings
    const acceptedCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE trip_id = ? AND status IN ('accepted', 'picked_up')
    `).get(trip.id).count;

    if (acceptedCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot modify trip because there are already accepted or ongoing bookings' 
      });
    }

    const {
      origin,
      destination,
      departure_date,
      total_space,
      price_per_unit,
      notes,
      status
    } = req.body;

    let newTotalSpace = total_space !== undefined ? parseFloat(total_space) : trip.total_space;
    let newAvailableSpace = newTotalSpace; // Since no accepted bookings, reset to new total

    const stmt = db.prepare(`
      UPDATE trips SET
        origin = COALESCE(?, origin),
        destination = COALESCE(?, destination),
        departure_date = COALESCE(?, departure_date),
        total_space = COALESCE(?, total_space),
        available_space = ?,
        price_per_unit = COALESCE(?, price_per_unit),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status)
      WHERE id = ?
    `);

    stmt.run(
      origin ? origin.trim() : null,
      destination ? destination.trim() : null,
      departure_date || null,
      total_space !== undefined ? parseFloat(total_space) : null,
      newAvailableSpace,
      price_per_unit !== undefined ? parseFloat(price_per_unit) : null,
      notes !== undefined ? notes.trim() : null,
      status || null,
      trip.id
    );

    const updatedTrip = db.prepare(`
      SELECT t.*, u.name as driver_name, u.vehicle_type, u.avg_rating
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE t.id = ?
    `).get(trip.id);

    return res.json({ message: 'Trip updated successfully', trip: updatedTrip });
  } catch (err) {
    console.error('Update trip error:', err);
    return res.status(500).json({ error: 'Failed to update trip' });
  }
});

// DELETE /api/trips/:id - Cancel trip (Owner only)
router.delete('/:id', authenticateToken, requireRole('driver'), (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.driver_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this trip' });
    }

    const acceptedCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE trip_id = ? AND status IN ('accepted', 'picked_up')
    `).get(trip.id).count;

    if (acceptedCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot cancel trip with active bookings. Please coordinate with merchants first.' 
      });
    }

    db.prepare("UPDATE trips SET status = 'cancelled' WHERE id = ?").run(trip.id);

    // Cancel any pending requested bookings
    db.prepare("UPDATE bookings SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND status = 'requested'").run(trip.id);

    return res.json({ message: 'Trip cancelled successfully' });
  } catch (err) {
    console.error('Cancel trip error:', err);
    return res.status(500).json({ error: 'Failed to cancel trip' });
  }
});

export default router;
