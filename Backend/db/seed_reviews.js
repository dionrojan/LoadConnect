import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'yoki.db');
const db = new Database(dbPath);

// Realistic fake reviews for all Kerala and demo Drivers and Merchants
const driverReviews = [
  // 1. Sasi Kumar (driver.sasi@kerala.test)
  {
    driverEmail: 'driver.sasi@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Sasi is our go-to driver along KK Road. Transported 18 bags of organic cardamom from Kanjirappally to Kumily safely. Punctual and very respectful.',
    createdAt: '2026-09-12 11:20:00'
  },
  {
    driverEmail: 'driver.sasi@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Handled our ginger and spice consignment perfectly. Good lashings on his flatbed, no shifting during transit down the ghats.',
    createdAt: '2026-09-18 14:45:00'
  },
  {
    driverEmail: 'driver.sasi@kerala.test',
    merchantEmail: 'anish.highrange@kerala.test',
    rating: 4,
    comment: 'Quick pickup at our depot. Reached destination well before our receiving gate closed. Very professional driver.',
    createdAt: '2026-09-22 09:15:00'
  },

  // 2. Jomon Joseph (driver.jomon@kerala.test)
  {
    driverEmail: 'driver.jomon@kerala.test',
    merchantEmail: 'anish.highrange@kerala.test',
    rating: 5,
    comment: 'Jomon navigated the steep ghat curves to Kattappana without breaking any seals. His Dost truck was clean and weather-sealed.',
    createdAt: '2026-09-14 16:30:00'
  },
  {
    driverEmail: 'driver.jomon@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Reliable highrange transport. Picked up cocoa beans from our Ponkunnam branch on time without delay.',
    createdAt: '2026-09-19 10:10:00'
  },
  {
    driverEmail: 'driver.jomon@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 4,
    comment: 'Prompt delivery of packaging materials. Clear updates over in-app chat throughout the journey.',
    createdAt: '2026-09-23 15:40:00'
  },

  // 3. Rajesh Pillai (driver.rajesh@kerala.test)
  {
    driverEmail: 'driver.rajesh@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 5,
    comment: 'Rajesh\'s heavy BharatBenz handled our 12-ton shipment of export coir bales effortlessly down NH 66 to Kollam port. Highly recommended.',
    createdAt: '2026-09-10 12:00:00'
  },
  {
    driverEmail: 'driver.rajesh@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Excellent hauler for heavy steel sections and ceramic crates. Very skilled at maneuvering into tight industrial bays.',
    createdAt: '2026-09-16 11:30:00'
  },
  {
    driverEmail: 'driver.rajesh@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Consignment arrived in prime condition at the container freight station. Will definitely book again.',
    createdAt: '2026-09-21 17:20:00'
  },

  // 4. Shibu Mathew (driver.shibu@kerala.test)
  {
    driverEmail: 'driver.shibu@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 5,
    comment: 'Shibu made a scheduled stop at our Alappuzha bypass facility. Container body kept our finished mats dry during torrential rain.',
    createdAt: '2026-09-11 13:15:00'
  },
  {
    driverEmail: 'driver.shibu@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Transferred 15 pallets of organic coconut oil to Thiruvananthapuram distribution center without delays.',
    createdAt: '2026-09-17 18:00:00'
  },
  {
    driverEmail: 'driver.shibu@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 4,
    comment: 'Good communication throughout the NH 66 corridor. Prompt arrival at Trivandrum unloading bay.',
    createdAt: '2026-09-22 14:10:00'
  },

  // 5. Biju Varghese (driver.biju@kerala.test)
  {
    driverEmail: 'driver.biju@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Biju picked up building hardware from our Thrissur facility and delivered to Palakkad ahead of schedule. Very secure container.',
    createdAt: '2026-09-13 10:05:00'
  },
  {
    driverEmail: 'driver.biju@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Smooth haul through the Palakkad gap corridor. Punctual, polite, and great coordination with our warehouse team.',
    createdAt: '2026-09-19 12:40:00'
  },
  {
    driverEmail: 'driver.biju@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Bulk spice transit was seamless. Clean floorboards and zero moisture inside the truck.',
    createdAt: '2026-09-24 16:50:00'
  },

  // 6. Dileep Nair (driver.dileep@kerala.test)
  {
    driverEmail: 'driver.dileep@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Dileep\'s Bolero Maxi Truck is perfect for express dispatch to North Kerala. Handled our urgent pump sets carefully.',
    createdAt: '2026-09-12 09:30:00'
  },
  {
    driverEmail: 'driver.dileep@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 4,
    comment: 'Prompt delivery to Kozhikode supermarket warehouse. Great attitude and tracking updates.',
    createdAt: '2026-09-18 16:20:00'
  },
  {
    driverEmail: 'driver.dileep@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 5,
    comment: 'Fast and dependable. Bolero truck arrived clean and ready to load on short notice.',
    createdAt: '2026-09-23 11:15:00'
  },

  // 7. Vinod Kurian (driver.vinod@kerala.test)
  {
    driverEmail: 'driver.vinod@kerala.test',
    merchantEmail: 'anish.highrange@kerala.test',
    rating: 5,
    comment: 'Vinod\'s refrigerated truck kept our temperature-sensitive vanilla and cocoa beans at constant 18°C up the steep incline to Munnar. Outstanding service!',
    createdAt: '2026-09-15 15:10:00'
  },
  {
    driverEmail: 'driver.vinod@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Reefer temperature logs were immaculate upon arrival. Professional cold chain hauler, Vinod is top-tier.',
    createdAt: '2026-09-20 17:35:00'
  },
  {
    driverEmail: 'driver.vinod@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Delicate organic samples transported in chilled conditions with zero spoilage. Highly recommended.',
    createdAt: '2026-09-24 13:00:00'
  },

  // 8. Harikrishnan R (driver.hari@kerala.test)
  {
    driverEmail: 'driver.hari@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Harikrishnan covered the Kottayam to Trivandrum MC road stretch in record time. Smooth driving, no cargo damage.',
    createdAt: '2026-09-14 11:00:00'
  },
  {
    driverEmail: 'driver.hari@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 4,
    comment: 'Picked up samples from Changanassery branch. Polite driver and very neat truck.',
    createdAt: '2026-09-19 14:25:00'
  },
  {
    driverEmail: 'driver.hari@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Delivered export paperwork and sample cases directly to Trivandrum customs house. Commendable service.',
    createdAt: '2026-09-23 18:40:00'
  },

  // 9. Joy Sebastian (driver.joy@kerala.test)
  {
    driverEmail: 'driver.joy@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Joy handled our coastal Malabar dispatch with his Ashok Leyland Partner. Smooth run from Kozhikode to Kannur.',
    createdAt: '2026-09-13 13:50:00'
  },
  {
    driverEmail: 'driver.joy@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 4,
    comment: 'Palletized spices reached Kannur retail store intact. Fair pricing and dependable driver.',
    createdAt: '2026-09-18 10:15:00'
  },
  {
    driverEmail: 'driver.joy@kerala.test',
    merchantEmail: 'anish.highrange@kerala.test',
    rating: 5,
    comment: 'Good service, helped inspect seals at destination. Will use again for northern distribution.',
    createdAt: '2026-09-22 16:30:00'
  },

  // 10. Anoop Chandran (driver.anoop@kerala.test)
  {
    driverEmail: 'driver.anoop@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Anoop\'s 32ft multi-axle truck easily cleared Walayar border checkpoint. Hauled 30 tons of structural steel to Coimbatore without a hitch.',
    createdAt: '2026-09-15 08:30:00'
  },
  {
    driverEmail: 'driver.anoop@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Huge capacity and very experienced interstate driver. Fast gate clearance at Tamil Nadu checkpost.',
    createdAt: '2026-09-20 12:00:00'
  },
  {
    driverEmail: 'driver.anoop@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 5,
    comment: 'Coir geotextile rolls were tied down securely. Great commercial transit driver.',
    createdAt: '2026-09-24 15:45:00'
  },

  // 11. Sudheer Babu (driver.sudheer@kerala.test)
  {
    driverEmail: 'driver.sudheer@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Sudheer\'s Tata Ace is the fastest same-day delivery option between Kottayam and Cochin. Delivered 8 sacks of dry pepper within 3 hours.',
    createdAt: '2026-09-16 14:00:00'
  },
  {
    driverEmail: 'driver.sudheer@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Perfect small cargo hauler for city center deliveries in Ernakulam. Maneuvers through tight lanes easily.',
    createdAt: '2026-09-21 11:30:00'
  },
  {
    driverEmail: 'driver.sudheer@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 4,
    comment: 'Great for small parcel consignments. Arrived on time and delivered safely.',
    createdAt: '2026-09-25 10:20:00'
  },

  // 12. Shaji Mohammed (driver.shaji@kerala.test)
  {
    driverEmail: 'driver.shaji@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 5,
    comment: 'Shaji is stationed right by Alappuzha. Loaded our heavy coir yarn spools and reached Cochin Port Trust wharf promptly.',
    createdAt: '2026-09-14 09:10:00'
  },
  {
    driverEmail: 'driver.shaji@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Clean dry container bed. Protected our seafood and dry goods consignment thoroughly from sea spray.',
    createdAt: '2026-09-19 16:40:00'
  },
  {
    driverEmail: 'driver.shaji@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Smooth pickup and drop-off. Experienced driver with deep route knowledge of coastal NH.',
    createdAt: '2026-09-23 13:15:00'
  },

  // 13. Pradeep Kumar (driver.pradeep@kerala.test)
  {
    driverEmail: 'driver.pradeep@kerala.test',
    merchantEmail: 'faisal.hardware@kerala.test',
    rating: 5,
    comment: 'Pradeep\'s Eicher Pro 3015 navigated through Kuthiran tunnel effortlessly with our electrical switchgear consignment. Excellent driver.',
    createdAt: '2026-09-13 15:30:00'
  },
  {
    driverEmail: 'driver.pradeep@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 4,
    comment: 'Transported bulk agricultural machinery components to Palakkad agro-center safely.',
    createdAt: '2026-09-18 11:45:00'
  },
  {
    driverEmail: 'driver.pradeep@kerala.test',
    merchantEmail: 'anish.highrange@kerala.test',
    rating: 5,
    comment: 'Very courteous and careful driver. Arrived ahead of time and assisted with offloading.',
    createdAt: '2026-09-22 17:00:00'
  },

  // 14. Renjith Nair (driver.renjith@kerala.test)
  {
    driverEmail: 'driver.renjith@kerala.test',
    merchantEmail: 'sujith.coir@kerala.test',
    rating: 5,
    comment: 'Renjith took our cashew and coir packaging shipment to Technopark Trivandrum without any issues. Very professional.',
    createdAt: '2026-09-15 10:50:00'
  },
  {
    driverEmail: 'driver.renjith@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Reliable southern corridor hauler. Everything accounted for at the delivery gate.',
    createdAt: '2026-09-20 14:15:00'
  },
  {
    driverEmail: 'driver.renjith@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 4,
    comment: 'Good service and reasonable space rates. Recommended.',
    createdAt: '2026-09-24 11:30:00'
  },

  // 15. Suresh Menon (driver.suresh@kerala.test)
  {
    driverEmail: 'driver.suresh@kerala.test',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Suresh regularly shuttles between Kanjirappally estates and Kottayam rubber auctions. Nobody knows the KK Road terrain better than him!',
    createdAt: '2026-09-16 16:20:00'
  },
  {
    driverEmail: 'driver.suresh@kerala.test',
    merchantEmail: 'anish.highrange@kerala.test',
    rating: 5,
    comment: 'Dependable local pickup for raw spices. Always willing to assist with strapping and tarping.',
    createdAt: '2026-09-21 09:40:00'
  },
  {
    driverEmail: 'driver.suresh@kerala.test',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Swift transport of cardamom bags down from the foothills to Kottayam depot.',
    createdAt: '2026-09-25 14:50:00'
  },

  // 16. Dave "Longhaul" Miller (demo_driver@yoki.test)
  {
    driverEmail: 'demo_driver@yoki.test',
    merchantEmail: 'demo_merchant@yoki.test',
    rating: 5,
    comment: 'Dave is a veteran longhaul hauler. Hauled our bulk produce across state lines with temperature monitoring and prompt delivery.',
    createdAt: '2026-09-10 10:00:00'
  },
  {
    driverEmail: 'demo_driver@yoki.test',
    merchantEmail: 'donagmail',
    rating: 5,
    comment: 'Top notch driver. Rig was spotless and arrived exactly within the scheduled delivery window.',
    createdAt: '2026-09-17 15:30:00'
  },

  // 17. dion (diongmail)
  {
    driverEmail: 'diongmail',
    merchantEmail: 'manoj.spices@kerala.test',
    rating: 5,
    comment: 'Dion was extremely prompt for our Kanjirappally to Kottayam haul. Handled all cargo with care and communicated every milestone.',
    createdAt: '2026-09-20 11:00:00'
  },
  {
    driverEmail: 'diongmail',
    merchantEmail: 'priya.organics@kerala.test',
    rating: 5,
    comment: 'Smooth and transparent booking. Dion updated his location in real time and delivered on time.',
    createdAt: '2026-09-23 14:10:00'
  },
  {
    driverEmail: 'diongmail',
    merchantEmail: 'donagmail',
    rating: 5,
    comment: 'Excellent hauler! Friendly, reliable, and took great care of our packaged goods.',
    createdAt: '2026-09-25 16:30:00'
  }
];

// Realistic fake reviews for all Merchants (reviewed by drivers)
const merchantReviews = [
  // 1. Manoj Thomas (manoj.spices@kerala.test) - Travancore Spices & Plantations
  {
    merchantEmail: 'manoj.spices@kerala.test',
    driverEmail: 'driver.sasi@kerala.test',
    rating: 5,
    comment: 'Great merchant to work with. Loading dock at Rubber Board Jn is spacious, and their crew loaded 18 bags of spices in under 20 minutes.',
    createdAt: '2026-09-12 12:30:00'
  },
  {
    merchantEmail: 'manoj.spices@kerala.test',
    driverEmail: 'driver.suresh@kerala.test',
    rating: 5,
    comment: 'Manoj is always organized. Waybills, e-way bills, and gate passes are pre-printed. Fast turnarounds every single time.',
    createdAt: '2026-09-17 17:00:00'
  },
  {
    merchantEmail: 'manoj.spices@kerala.test',
    driverEmail: 'driver.sudheer@kerala.test',
    rating: 5,
    comment: 'Very courteous merchant. Offers refreshments to drivers and provides clear unloading contacts at Kottayam depot.',
    createdAt: '2026-09-22 15:00:00'
  },

  // 2. Sujith Varghese (sujith.coir@kerala.test) - Vembanad Coir & Marine Exporters
  {
    merchantEmail: 'sujith.coir@kerala.test',
    driverEmail: 'driver.rajesh@kerala.test',
    rating: 5,
    comment: 'Excellent facility along Boat Jetty Road. The crane crew assisted with loading heavy coir rolls and strapping them down properly.',
    createdAt: '2026-09-10 13:30:00'
  },
  {
    merchantEmail: 'sujith.coir@kerala.test',
    driverEmail: 'driver.shaji@kerala.test',
    rating: 5,
    comment: 'Superb merchant. Accurate cargo weight declared, no overloading surprises. Always prompt payment and sign-off.',
    createdAt: '2026-09-15 11:00:00'
  },
  {
    merchantEmail: 'sujith.coir@kerala.test',
    driverEmail: 'driver.shibu@kerala.test',
    rating: 4,
    comment: 'Easy access dock close to the bypass. Polite warehouse staff and quick dispatch clearance.',
    createdAt: '2026-09-20 14:00:00'
  },

  // 3. Faisal Rahman (faisal.hardware@kerala.test) - Malabar Builders & Hardware Trade
  {
    merchantEmail: 'faisal.hardware@kerala.test',
    driverEmail: 'driver.biju@kerala.test',
    rating: 5,
    comment: 'Forklift operators at East Fort gate are skilled and careful with vehicle bed surfaces. Goods were bundled and tagged neatly.',
    createdAt: '2026-09-13 11:15:00'
  },
  {
    merchantEmail: 'faisal.hardware@kerala.test',
    driverEmail: 'driver.anoop@kerala.test',
    rating: 5,
    comment: 'Loaded 30 tons of steel smoothly. Overhead gantry crane made loading fast and effortless. Highly recommended merchant.',
    createdAt: '2026-09-17 09:45:00'
  },
  {
    merchantEmail: 'faisal.hardware@kerala.test',
    driverEmail: 'driver.pradeep@kerala.test',
    rating: 4,
    comment: 'Reliable merchant. Clear paperwork and zero waiting time at the commercial gate.',
    createdAt: '2026-09-21 16:30:00'
  },

  // 4. Priya Menon (priya.organics@kerala.test) - Cochin Agro-Export Consortium
  {
    merchantEmail: 'priya.organics@kerala.test',
    driverEmail: 'driver.vinod@kerala.test',
    rating: 5,
    comment: 'Pre-chilled cargo ready for immediate loading into reefer. Detailed temperature manifests and professional warehouse team at Willingdon Island.',
    createdAt: '2026-09-16 18:00:00'
  },
  {
    merchantEmail: 'priya.organics@kerala.test',
    driverEmail: 'driver.hari@kerala.test',
    rating: 5,
    comment: 'Top class merchant. Clean dock, pallet jacks ready, and instant delivery receipt approval in the app.',
    createdAt: '2026-09-21 12:15:00'
  },
  {
    merchantEmail: 'priya.organics@kerala.test',
    driverEmail: 'driver.dileep@kerala.test',
    rating: 5,
    comment: 'Very professional exporter. Packing is export-grade with moisture-proof wrapping. Seamless coordination.',
    createdAt: '2026-09-24 17:30:00'
  },

  // 5. Anish George (anish.highrange@kerala.test) - Highrange Cardamom & Cocoa Hub
  {
    merchantEmail: 'anish.highrange@kerala.test',
    driverEmail: 'driver.jomon@kerala.test',
    rating: 5,
    comment: 'Great loading point in Adimali town. The crew helped tarp the truck securely before rain started on the highrange descent.',
    createdAt: '2026-09-15 17:00:00'
  },
  {
    merchantEmail: 'anish.highrange@kerala.test',
    driverEmail: 'driver.vinod@kerala.test',
    rating: 5,
    comment: 'Cardamom and cocoa crates were pre-weighed and sealed with tamper-evident tape. Excellent merchant to partner with.',
    createdAt: '2026-09-19 16:00:00'
  },
  {
    merchantEmail: 'anish.highrange@kerala.test',
    driverEmail: 'driver.sasi@kerala.test',
    rating: 4,
    comment: 'Honest merchant with realistic loading timeframes. Smooth handoff every time.',
    createdAt: '2026-09-23 10:45:00'
  },

  // 6. Maria Santos (demo_merchant@yoki.test) - Maria Santos Produce
  {
    merchantEmail: 'demo_merchant@yoki.test',
    driverEmail: 'demo_driver@yoki.test',
    rating: 5,
    comment: 'Maria always has refrigerated bays ready. Pallets are shrink-wrapped to perfection and ready for longhaul transit.',
    createdAt: '2026-09-11 11:30:00'
  },
  {
    merchantEmail: 'demo_merchant@yoki.test',
    driverEmail: 'diongmail',
    rating: 5,
    comment: 'Fast loading and pleasant coordination. Paperwork was completely clear and warehouse crew was very helpful.',
    createdAt: '2026-09-22 13:00:00'
  },

  // 7. dona (donagmail)
  {
    merchantEmail: 'donagmail',
    driverEmail: 'diongmail',
    rating: 5,
    comment: 'Super smooth pickup! Goods were neatly packaged, labeled, and ready at the door. Very pleasant coordination.',
    createdAt: '2026-09-21 15:00:00'
  },
  {
    merchantEmail: 'donagmail',
    driverEmail: 'driver.sudheer@kerala.test',
    rating: 5,
    comment: 'Easy to find location and quick loading. Great merchant to haul for.',
    createdAt: '2026-09-24 11:00:00'
  },

  // 8. Sarah Shopkeeper (test accounts)
  {
    merchantEmail: 'merchant_1790121072167@yoki.test',
    driverEmail: 'driver_1790121072167@yoki.test',
    rating: 5,
    comment: 'Sarah is an outstanding merchant. Goods were boxed, barcoded, and ready when my truck backed into the loading bay.',
    createdAt: '2026-09-23 09:30:00'
  },
  {
    merchantEmail: 'merchant_1790215270486@yoki.test',
    driverEmail: 'driver_1790215270486@yoki.test',
    rating: 5,
    comment: 'Great merchant partner. Clear directions, quick forklift loading, and fast digital confirmation.',
    createdAt: '2026-09-24 10:15:00'
  }
];

export function seedReviews() {
  console.log('⭐ Seeding fake verified reviews for all drivers and merchants...');

  const getUser = db.prepare('SELECT id, name, role, email FROM users WHERE email = ?');
  const getDriverTrip = db.prepare('SELECT id FROM trips WHERE driver_id = ? ORDER BY id DESC LIMIT 1');
  const insertTrip = db.prepare(`
    INSERT INTO trips (driver_id, origin, destination, departure_date, total_space, available_space, price_per_unit, notes, status)
    VALUES (?, 'Kochi, Kerala', 'Kottayam, Kerala', '2026-09-10', 20, 0, 100, 'Past completed delivery route', 'completed')
  `);
  const getDeliveredBooking = db.prepare(`
    SELECT b.id FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    WHERE t.driver_id = ? AND b.merchant_id = ? AND b.status = 'delivered'
    LIMIT 1
  `);
  const insertBooking = db.prepare(`
    INSERT INTO bookings (trip_id, merchant_id, space_requested, pickup_address, status, created_at, updated_at)
    VALUES (?, ?, 5, 'Consignment Depot', 'delivered', ?, ?)
  `);
  const checkReview = db.prepare('SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?');
  const insertReview = db.prepare(`
    INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let addedCount = 0;

  // 1. Process reviews for Drivers (Merchant reviewing Driver)
  driverReviews.forEach((item) => {
    const driver = getUser.get(item.driverEmail);
    const merchant = getUser.get(item.merchantEmail);

    if (!driver || !merchant) {
      return;
    }

    // Find or create completed trip for driver
    let trip = getDriverTrip.get(driver.id);
    let tripId;
    if (!trip) {
      const res = insertTrip.run(driver.id);
      tripId = res.lastInsertRowid;
    } else {
      tripId = trip.id;
    }

    // Find or create delivered booking between this merchant and driver
    let booking = getDeliveredBooking.get(driver.id, merchant.id);
    let bookingId;
    if (!booking) {
      const bRes = insertBooking.run(tripId, merchant.id, item.createdAt, item.createdAt);
      bookingId = bRes.lastInsertRowid;
    } else {
      bookingId = booking.id;
    }

    // Insert review if not already present
    const existing = checkReview.get(bookingId, merchant.id);
    if (!existing) {
      insertReview.run(bookingId, merchant.id, driver.id, item.rating, item.comment, item.createdAt);
      addedCount++;
    }
  });

  // 2. Process reviews for Merchants (Driver reviewing Merchant)
  merchantReviews.forEach((item) => {
    const merchant = getUser.get(item.merchantEmail);
    const driver = getUser.get(item.driverEmail);

    if (!merchant || !driver) {
      return;
    }

    // Find or create completed trip for driver
    let trip = getDriverTrip.get(driver.id);
    let tripId;
    if (!trip) {
      const res = insertTrip.run(driver.id);
      tripId = res.lastInsertRowid;
    } else {
      tripId = trip.id;
    }

    // Find or create delivered booking between this merchant and driver
    let booking = getDeliveredBooking.get(driver.id, merchant.id);
    let bookingId;
    if (!booking) {
      const bRes = insertBooking.run(tripId, merchant.id, item.createdAt, item.createdAt);
      bookingId = bRes.lastInsertRowid;
    } else {
      bookingId = booking.id;
    }

    // Insert review if not already present
    const existing = checkReview.get(bookingId, driver.id);
    if (!existing) {
      insertReview.run(bookingId, driver.id, merchant.id, item.rating, item.comment, item.createdAt);
      addedCount++;
    }
  });

  // 3. Recalculate average rating & total reviews for all users who have received reviews
  const allUsersWithReviews = db.prepare('SELECT DISTINCT reviewee_id FROM reviews').all();
  const updateStats = db.prepare(`
    UPDATE users 
    SET avg_rating = (
      SELECT ROUND(AVG(rating), 1) FROM reviews WHERE reviewee_id = users.id
    ),
    total_reviews = (
      SELECT COUNT(*) FROM reviews WHERE reviewee_id = users.id
    )
    WHERE id = ?
  `);

  allUsersWithReviews.forEach(({ reviewee_id }) => {
    updateStats.run(reviewee_id);
  });

  console.log(`✅ Seeded ${addedCount} new reviews. Recalculated stats for ${allUsersWithReviews.length} drivers & merchants.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedReviews();
}
