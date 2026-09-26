// Dynamic resolver supporting Localhost, VS Code Dev Tunnels, LAN IP, and Cloud (Render)
export function getBackendBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, origin } = window.location;

    // 1. VS Code Dev Tunnels (auto-map port 5173 -> port 5000)
    if (hostname.includes('devtunnels.ms')) {
      return origin.replace('-5173.', '-5000.').replace(':5173', ':5000');
    }

    // 2. Local Wi-Fi / LAN IP (e.g. 10.29.136.112)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:5000`;
    }
  }

  // 3. Localhost
  return 'http://localhost:5000';
}

export function getApiUrl() {
  return `${getBackendBaseUrl()}/api`;
}

class ApiClient {
  constructor() {}

  getBaseUrl() {
    return getApiUrl();
  }

  getToken() {
    return localStorage.getItem('yoki_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('yoki_token', token);
    } else {
      localStorage.removeItem('yoki_token');
    }
  }

  async request(path, options = {}) {
    const url = `${this.getBaseUrl()}${path}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Centralized 401 handling
        if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/signup')) {
          this.setToken(null);
          localStorage.removeItem('yoki_user');
          window.dispatchEvent(new CustomEvent('yoki_unauthorized'));
        }

        const error = new Error(data.error || `HTTP error ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (!err.status) {
        // Network / CORS / Server offline error
        console.warn(`[API] Connection issue connecting to ${url}:`, err.message);
      }
      throw err;
    }
  }
}

export const client = new ApiClient();

// --- Auth Endpoints ---
export const authAPI = {
  signup: (payload) => client.request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => client.request('/auth/login', { method: 'POST', body: payload }),
  getMe: () => client.request('/auth/me'),
  updateMe: (payload) => client.request('/auth/me', { method: 'PUT', body: payload }),
};

// --- Trips Endpoints ---
export const tripsAPI = {
  getTrips: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return client.request(`/trips${qs}`);
  },
  getTripById: (id) => client.request(`/trips/${id}`),
  createTrip: (payload) => client.request('/trips', { method: 'POST', body: payload }),
  updateTrip: (id, payload) => client.request(`/trips/${id}`, { method: 'PUT', body: payload }),
  cancelTrip: (id) => client.request(`/trips/${id}`, { method: 'DELETE' }),
};

// --- Bookings Endpoints ---
export const bookingsAPI = {
  getBookings: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return client.request(`/bookings${qs}`);
  },
  getBookingById: (id) => client.request(`/bookings/${id}`),
  createBooking: (payload) => client.request('/bookings', { method: 'POST', body: payload }),
  updateStatus: (id, status) => client.request(`/bookings/${id}/status`, { method: 'PUT', body: { status } }),
};

// --- Messages Endpoints (REST Fallback) ---
export const messagesAPI = {
  getMessages: (bookingId) => client.request(`/messages/${bookingId}`),
  sendMessage: (bookingId, content) => client.request(`/messages/${bookingId}`, { method: 'POST', body: { content } }),
};

// --- Reviews Endpoints ---
export const reviewsAPI = {
  submitReview: (payload) => client.request('/reviews', { method: 'POST', body: payload }),
  getUserReviews: (userId) => client.request(`/reviews/user/${userId}`),
};
