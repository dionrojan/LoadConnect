import jwt from 'jsonwebtoken';
import { db } from '../db/setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yoki_jwt_secret_hackathon_key_2024';

export function setupSocket(io) {
  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected to socket: ${socket.user?.id} (${socket.id})`);

    // Client requests to join a booking conversation room
    socket.on('join_booking', ({ bookingId }) => {
      try {
        const booking = db.prepare(`
          SELECT b.id, b.status, b.merchant_id, t.driver_id
          FROM bookings b
          JOIN trips t ON b.trip_id = t.id
          WHERE b.id = ?
        `).get(bookingId);

        if (!booking) {
          return socket.emit('error', { message: 'Booking not found' });
        }

        const isParty = booking.merchant_id === socket.user.id || booking.driver_id === socket.user.id;
        if (!isParty) {
          return socket.emit('error', { message: 'Not authorized for this booking chat' });
        }

        const roomName = `booking_${bookingId}`;
        socket.join(roomName);
        console.log(`User ${socket.user.id} joined ${roomName}`);
        socket.emit('joined_room', { bookingId, room: roomName });
      } catch (err) {
        console.error('join_booking error:', err);
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });

    // Client sends a message in a booking room
    socket.on('send_message', ({ bookingId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const booking = db.prepare(`
          SELECT b.id, b.status, b.merchant_id, t.driver_id
          FROM bookings b
          JOIN trips t ON b.trip_id = t.id
          WHERE b.id = ?
        `).get(bookingId);

        if (!booking) {
          return socket.emit('error', { message: 'Booking not found' });
        }

        const isParty = booking.merchant_id === socket.user.id || booking.driver_id === socket.user.id;
        if (!isParty) {
          return socket.emit('error', { message: 'Not authorized to send messages' });
        }

        if (!['accepted', 'picked_up', 'delivered'].includes(booking.status)) {
          return socket.emit('error', { message: 'Chat is locked until booking is accepted' });
        }

        // Insert into database
        const stmt = db.prepare(`
          INSERT INTO messages (booking_id, sender_id, content)
          VALUES (?, ?, ?)
        `);
        const result = stmt.run(bookingId, socket.user.id, content.trim());

        const savedMessage = db.prepare(`
          SELECT 
            m.id, m.booking_id, m.sender_id, m.content, m.created_at,
            u.name as sender_name, u.role as sender_role
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.id = ?
        `).get(result.lastInsertRowid);

        const roomName = `booking_${bookingId}`;
        // Broadcast to everyone in the room (including sender)
        io.to(roomName).emit('receive_message', savedMessage);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user?.id}`);
    });
  });
}
