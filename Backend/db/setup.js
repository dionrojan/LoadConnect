import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'yoki.db');
export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('driver', 'merchant')),
      vehicle_type TEXT,
      max_capacity REAL,
      business_name TEXT,
      business_address TEXT,
      avg_rating REAL DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      total_space REAL NOT NULL,
      available_space REAL NOT NULL,
      price_per_unit REAL NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      merchant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      space_requested REAL NOT NULL,
      status TEXT DEFAULT 'requested' CHECK(status IN ('requested', 'accepted', 'declined', 'picked_up', 'delivered')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(booking_id, reviewer_id)
    );

    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_trips_origin_dest ON trips(origin, destination);
    CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_merchant ON bookings(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
  `;

  db.exec(schema);
  console.log('✅ SQLite database initialized successfully at', dbPath);
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDB();
}
