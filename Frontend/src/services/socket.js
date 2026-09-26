import { io } from 'socket.io-client';
import { getBackendBaseUrl } from './api.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (!token) {
      token = localStorage.getItem('yoki_token');
    }

    if (!token) return null;

    const socketUrl = getBackendBaseUrl();
    this.socket = io(socketUrl, {
      auth: { token },
      extraHeaders: {
        'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('📡 Connected to YOKI real-time socket');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('🔌 Disconnected from socket');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinBooking(bookingId) {
    if (this.socket) {
      this.socket.emit('join_booking', { bookingId });
    }
  }

  sendMessage(bookingId, content) {
    if (this.socket) {
      this.socket.emit('send_message', { bookingId, content });
    }
  }

  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receive_message', callback);
    }
  }

  offReceiveMessage(callback) {
    if (this.socket) {
      this.socket.off('receive_message', callback);
    }
  }
}

export const socketService = new SocketService();
