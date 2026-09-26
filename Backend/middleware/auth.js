import jwt from 'jsonwebtoken';
import { db } from '../db/setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoki_jwt_secret_hackathon_key_2024';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, name, email, phone, role, vehicle_type, max_capacity, business_name, business_address, avg_rating, total_reviews, created_at 
      FROM users WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: requires one of the following roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
}
