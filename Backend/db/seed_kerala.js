import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'yoki.db');
const db = new Database(dbPath);

const PASSWORD_HASH = '$2b$10$DDYFOK.FKi6ez5vITLX33OqmgNycsC7vZxSAI/DTNUGVGEFJM.jlG'; // password123

// 1. Five Kerala Merchants
const merchants = [
  {
    name: 'Manoj Thomas',
    email: 'manoj.spices@kerala.test',
    phone: '+91 94471 23456',
    role: 'merchant',
    business_name: 'Travancore Spices & Plantations',
    business_address: 'Rubber Board Jn, Kanjirappally, Kottayam',
    avg_rating: 4.9,
    total_reviews: 18,
  },
  {
    name: 'Sujith Varghese',
    email: 'sujith.coir@kerala.test',
    phone: '+91 98460 34567',
    role: 'merchant',
    business_name: 'Vembanad Coir & Marine Exporters',
    business_address: 'Boat Jetty Road, Alappuzha, Kerala',
    avg_rating: 4.8,
    total_reviews: 24,
  },
  {
    name: 'Faisal Rahman',
    email: 'faisal.hardware@kerala.test',
    phone: '+91 97455 45678',
    role: 'merchant',
    business_name: 'Malabar Builders & Hardware Trade',
    business_address: 'East Fort Commercial Gate, Thrissur, Kerala',
    avg_rating: 4.7,
    total_reviews: 15,
  },
  {
    name: 'Priya Menon',
    email: 'priya.organics@kerala.test',
    phone: '+91 99462 56789',
    role: 'merchant',
    business_name: 'Cochin Agro-Export Consortium',
    business_address: 'Wharf Road, Willingdon Island, Kochi, Kerala',
    avg_rating: 4.9,
    total_reviews: 32,
  },
  {
    name: 'Anish George',
    email: 'anish.highrange@kerala.test',
    phone: '+91 94463 67890',
    role: 'merchant',
    business_name: 'Highrange Cardamom & Cocoa Hub',
    business_address: 'Town Center, Adimali, Idukki, Kerala',
    avg_rating: 4.8,
    total_reviews: 12,
  }
];

// 2. Fifteen Kerala Drivers with vehicles & trips
const driversAndTrips = [
  {
    driver: {
      name: 'Sasi Kumar',
      email: 'driver.sasi@kerala.test',
      phone: '+91 94470 11223',
      vehicle_type: 'Tata 407 (14ft Flatbed)',
      max_capacity: 25,
      avg_rating: 4.9,
      total_reviews: 38,
    },
    trip: {
      origin: 'Kottayam, Kerala',
      destination: 'Kumily, Kerala',
      departure_date: '2026-09-28',
      total_space: 25,
      available_space: 18,
      price_per_unit: 120,
      notes: 'Passing through Kanjirappally (Rubber Board Jn) along KK Road (NH 183). Can pick up consignments for Travancore Spices.',
    }
  },
  {
    driver: {
      name: 'Jomon Joseph',
      email: 'driver.jomon@kerala.test',
      phone: '+91 98471 22334',
      vehicle_type: 'Ashok Leyland Dost (8ft Closed)',
      max_capacity: 20,
      avg_rating: 4.8,
      total_reviews: 22,
    },
    trip: {
      origin: 'Kochi, Kerala',
      destination: 'Kattappana, Kerala',
      departure_date: '2026-09-29',
      total_space: 20,
      available_space: 14,
      price_per_unit: 140,
      notes: 'Highrange cargo run via Pala and Ponkunnam. Passing directly through Kanjirappally town center.',
    }
  },
  {
    driver: {
      name: 'Rajesh Pillai',
      email: 'driver.rajesh@kerala.test',
      phone: '+91 97462 33445',
      vehicle_type: 'BharatBenz 1617 (20ft Heavy)',
      max_capacity: 40,
      avg_rating: 4.9,
      total_reviews: 45,
    },
    trip: {
      origin: 'Kochi, Kerala',
      destination: 'Kollam, Kerala',
      departure_date: '2026-09-28',
      total_space: 40,
      available_space: 26,
      price_per_unit: 110,
      notes: 'Direct coastal NH 66 corridor. Passing Cherthala, Alappuzha (Boat Jetty & Coir Export zone), and Haripad.',
    }
  },
  {
    driver: {
      name: 'Shibu Mathew',
      email: 'driver.shibu@kerala.test',
      phone: '+91 99463 44556',
      vehicle_type: 'Eicher Pro 3019 (24ft Container)',
      max_capacity: 35,
      avg_rating: 4.7,
      total_reviews: 29,
    },
    trip: {
      origin: 'Kochi, Kerala',
      destination: 'Thiruvananthapuram, Kerala',
      departure_date: '2026-09-30',
      total_space: 35,
      available_space: 22,
      price_per_unit: 160,
      notes: 'Express cargo run via NH 66. Passing right through Alappuzha bypass for Vembanad Coir pickups.',
    }
  },
  {
    driver: {
      name: 'Biju Varghese',
      email: 'driver.biju@kerala.test',
      phone: '+91 94464 55667',
      vehicle_type: 'Tata 1109 Container',
      max_capacity: 30,
      avg_rating: 4.9,
      total_reviews: 51,
    },
    trip: {
      origin: 'Kochi, Kerala',
      destination: 'Palakkad, Kerala',
      departure_date: '2026-09-28',
      total_space: 30,
      available_space: 19,
      price_per_unit: 130,
      notes: 'Industrial corridor NH 544 via Angamaly, Chalakudy, and Thrissur (East Fort bypass near Malabar Hardware).',
    }
  },
  {
    driver: {
      name: 'Dileep Nair',
      email: 'driver.dileep@kerala.test',
      phone: '+91 98465 66778',
      vehicle_type: 'Mahindra Bolero Maxi Truck',
      max_capacity: 15,
      avg_rating: 4.8,
      total_reviews: 19,
    },
    trip: {
      origin: 'Kochi, Kerala',
      destination: 'Kozhikode, Kerala',
      departure_date: '2026-09-29',
      total_space: 15,
      available_space: 11,
      price_per_unit: 175,
      notes: 'North Kerala express via Thrissur, Kunnamkulam, and Edappal. Scheduled stop at Thrissur commercial hub.',
    }
  },
  {
    driver: {
      name: 'Vinod Kurian',
      email: 'driver.vinod@kerala.test',
      phone: '+91 97466 77889',
      vehicle_type: 'Tata 709 Refrigerated Truck',
      max_capacity: 22,
      avg_rating: 4.9,
      total_reviews: 34,
    },
    trip: {
      origin: 'Kochi, Kerala',
      destination: 'Munnar, Kerala',
      departure_date: '2026-09-29',
      total_space: 22,
      available_space: 15,
      price_per_unit: 180,
      notes: 'Hill route via Kothamangalam, Neriamangalam, and Adimali (passing Highrange Cardamom & Cocoa Hub).',
    }
  },
  {
    driver: {
      name: 'Harikrishnan R',
      email: 'driver.hari@kerala.test',
      phone: '+91 99467 88990',
      vehicle_type: 'Eicher Pro 2049 (12ft)',
      max_capacity: 18,
      avg_rating: 4.8,
      total_reviews: 27,
    },
    trip: {
      origin: 'Kottayam, Kerala',
      destination: 'Thiruvananthapuram, Kerala',
      departure_date: '2026-09-30',
      total_space: 18,
      available_space: 12,
      price_per_unit: 125,
      notes: 'Central Travancore MC Road corridor via Changanassery, Thiruvalla, Chengannur, and Adoor.',
    }
  },
  {
    driver: {
      name: 'Joy Sebastian',
      email: 'driver.joy@kerala.test',
      phone: '+91 94468 99001',
      vehicle_type: 'Ashok Leyland Partner (14ft)',
      max_capacity: 24,
      avg_rating: 4.7,
      total_reviews: 16,
    },
    trip: {
      origin: 'Kozhikode, Kerala',
      destination: 'Kannur, Kerala',
      departure_date: '2026-10-01',
      total_space: 24,
      available_space: 17,
      price_per_unit: 95,
      notes: 'Malabar coastal run via Koyilandy, Vadakara, Mahe, and Thalassery. Palletized loading available.',
    }
  },
  {
    driver: {
      name: 'Anoop Chandran',
      email: 'driver.anoop@kerala.test',
      phone: '+91 98469 00112',
      vehicle_type: 'BharatBenz 2823 (32ft Multi-Axle)',
      max_capacity: 45,
      avg_rating: 4.9,
      total_reviews: 62,
    },
    trip: {
      origin: 'Palakkad, Kerala',
      destination: 'Coimbatore, Tamil Nadu',
      departure_date: '2026-09-28',
      total_space: 45,
      available_space: 34,
      price_per_unit: 90,
      notes: 'Interstate commercial transit through Walayar. Fast commercial gate transit.',
    }
  },
  {
    driver: {
      name: 'Sudheer Babu',
      email: 'driver.sudheer@kerala.test',
      phone: '+91 97470 11223',
      vehicle_type: 'Tata Ace Gold (Small Cargo)',
      max_capacity: 10,
      avg_rating: 4.8,
      total_reviews: 41,
    },
    trip: {
      origin: 'Kottayam, Kerala',
      destination: 'Kochi, Kerala',
      departure_date: '2026-09-28',
      total_space: 10,
      available_space: 7,
      price_per_unit: 85,
      notes: 'Daily shuttle via Ettumanoor, Vaikom, and Tripunithura. Same-day delivery for agricultural produce.',
    }
  },
  {
    driver: {
      name: 'Shaji Mohammed',
      email: 'driver.shaji@kerala.test',
      phone: '+91 99471 22334',
      vehicle_type: 'Tata Ultra 1518 (20ft)',
      max_capacity: 30,
      avg_rating: 4.9,
      total_reviews: 33,
    },
    trip: {
      origin: 'Alappuzha, Kerala',
      destination: 'Kochi, Kerala',
      departure_date: '2026-09-29',
      total_space: 30,
      available_space: 21,
      price_per_unit: 95,
      notes: 'Seafood and coir dispatch to Cochin Port Trust. Insulated dry cargo bed.',
    }
  },
  {
    driver: {
      name: 'Pradeep Kumar',
      email: 'driver.pradeep@kerala.test',
      phone: '+91 94472 33445',
      vehicle_type: 'Eicher Pro 3015',
      max_capacity: 28,
      avg_rating: 4.7,
      total_reviews: 20,
    },
    trip: {
      origin: 'Thrissur, Kerala',
      destination: 'Palakkad, Kerala',
      departure_date: '2026-09-30',
      total_space: 28,
      available_space: 18,
      price_per_unit: 80,
      notes: 'Machinery and building material transit via Kuthiran tunnel corridor and Alathur.',
    }
  },
  {
    driver: {
      name: 'Renjith Nair',
      email: 'driver.renjith@kerala.test',
      phone: '+91 98473 44556',
      vehicle_type: 'Ashok Leyland Boss (17ft)',
      max_capacity: 25,
      avg_rating: 4.8,
      total_reviews: 25,
    },
    trip: {
      origin: 'Kollam, Kerala',
      destination: 'Thiruvananthapuram, Kerala',
      departure_date: '2026-09-29',
      total_space: 25,
      available_space: 16,
      price_per_unit: 90,
      notes: 'Cashew and packaging cargo run via NH 66 through Attingal and Kazhakkoottam Technopark.',
    }
  },
  {
    driver: {
      name: 'Suresh Menon',
      email: 'driver.suresh@kerala.test',
      phone: '+91 97474 55667',
      vehicle_type: 'Tata 407 Pickup',
      max_capacity: 15,
      avg_rating: 4.9,
      total_reviews: 48,
    },
    trip: {
      origin: 'Kanjirappally, Kerala',
      destination: 'Kottayam, Kerala',
      departure_date: '2026-09-28',
      total_space: 15,
      available_space: 10,
      price_per_unit: 75,
      notes: 'Rubber sheet and agricultural consignment transport down the KK Road ghat corridor.',
    }
  }
];

import { seedReviews } from './seed_reviews.js';

// Seed Function
export function seedKerala() {
  console.log('🌱 Seeding Kerala Merchants and Drivers...');

  // 1. Insert Merchants
  const insertMerchant = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, business_name, business_address, avg_rating, total_reviews)
    VALUES (@name, @email, '${PASSWORD_HASH}', @phone, 'merchant', @business_name, @business_address, @avg_rating, @total_reviews)
    ON CONFLICT(email) DO UPDATE SET
      business_name = excluded.business_name,
      business_address = excluded.business_address,
      phone = excluded.phone
  `);

  merchants.forEach(m => insertMerchant.run(m));
  console.log(`✅ ${merchants.length} Kerala merchants added/updated.`);

  // 2. Insert Drivers & Trips
  const insertDriver = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, vehicle_type, max_capacity, avg_rating, total_reviews)
    VALUES (@name, @email, '${PASSWORD_HASH}', @phone, 'driver', @vehicle_type, @max_capacity, @avg_rating, @total_reviews)
    ON CONFLICT(email) DO UPDATE SET
      vehicle_type = excluded.vehicle_type,
      max_capacity = excluded.max_capacity,
      phone = excluded.phone
  `);

  const insertTrip = db.prepare(`
    INSERT INTO trips (driver_id, origin, destination, departure_date, total_space, available_space, price_per_unit, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  let tripCount = 0;
  driversAndTrips.forEach(({ driver, trip }) => {
    insertDriver.run(driver);
    const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(driver.email);

    // Only create trip if user doesn't already have an active one with same route
    const existingTrip = db.prepare('SELECT id FROM trips WHERE driver_id = ? AND origin = ? AND destination = ?')
      .get(userRow.id, trip.origin, trip.destination);

    if (!existingTrip) {
      insertTrip.run(
        userRow.id,
        trip.origin,
        trip.destination,
        trip.departure_date,
        trip.total_space,
        trip.available_space,
        trip.price_per_unit,
        trip.notes
      );
      tripCount++;
    }
  });

  console.log(`✅ ${driversAndTrips.length} Kerala drivers and ${tripCount} active trips verified.`);
  seedReviews();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedKerala();
}
