import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/setup.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'yoki_jwt_secret_hackathon_key_2024';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      vehicle_type,
      max_capacity,
      business_name,
      business_address
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    if (!['driver', 'merchant'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "driver" or "merchant"' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (
        name, email, password_hash, phone, role,
        vehicle_type, max_capacity, business_name, business_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      email.toLowerCase().trim(),
      password_hash,
      phone || null,
      role,
      vehicle_type || null,
      max_capacity ? parseFloat(max_capacity) : null,
      business_name || null,
      business_address || null
    );

    const newUser = db.prepare(`
      SELECT id, name, email, phone, role, vehicle_type, max_capacity, business_name, business_address, avg_rating, total_reviews, created_at 
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...userProfile } = user;
    const token = generateToken(userProfile);

    return res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// PUT /api/auth/me
router.put('/me', authenticateToken, (req, res) => {
  try {
    const {
      name,
      phone,
      vehicle_type,
      max_capacity,
      business_name,
      business_address
    } = req.body;

    const stmt = db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        vehicle_type = COALESCE(?, vehicle_type),
        max_capacity = COALESCE(?, max_capacity),
        business_name = COALESCE(?, business_name),
        business_address = COALESCE(?, business_address)
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name.trim() : null,
      phone !== undefined ? phone : null,
      vehicle_type !== undefined ? vehicle_type : null,
      max_capacity !== undefined ? parseFloat(max_capacity) : null,
      business_name !== undefined ? business_name : null,
      business_address !== undefined ? business_address : null,
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, name, email, phone, role, vehicle_type, max_capacity, business_name, business_address, avg_rating, total_reviews, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
