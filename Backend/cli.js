#!/usr/bin/env node
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// ANSI Colors for formatting
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m'
};

let currentUser = null;
let currentToken = null;

const rl = readline.createInterface({ input, output });

async function ask(query) {
  return (await rl.question(`${c.cyan}${query}${c.reset} `)).trim();
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || `HTTP ${res.status}: ${res.statusText}`, status: res.status };
    }
    return { data, status: res.status };
  } catch (err) {
    return { error: `Connection failed to ${BASE_URL}: ${err.message}` };
  }
}

function printHeader() {
  console.clear();
  console.log(`${c.bold}${c.magenta}=====================================================${c.reset}`);
  console.log(`${c.bold}${c.bgMagenta} 🚛  YOKI Logistics Platform - Interactive Test CLI  ${c.reset}`);
  console.log(`${c.bold}${c.magenta}=====================================================${c.reset}`);
  if (currentUser) {
    const roleColor = currentUser.role === 'driver' ? c.blue : c.green;
    console.log(
      `👤 Logged In: ${c.bold}${currentUser.name}${c.reset} | Role: ${roleColor}${currentUser.role.toUpperCase()}${c.reset} | ID: ${currentUser.id} | Rating: ⭐ ${currentUser.avg_rating || 0}`
    );
  } else {
    console.log(`⚠️  Status: ${c.yellow}Not Logged In${c.reset} (Select an option below)`);
  }
  console.log(`${c.dim}Backend: ${BASE_URL}${c.reset}\n`);
}

async function checkServerHealth() {
  const res = await api('/health');
  if (res.error) {
    console.log(`${c.red}⚠️  Warning: Cannot reach backend server at ${BASE_URL}.${c.reset}`);
    console.log(`${c.yellow}👉 Make sure your server is running in another terminal tab: npm start${c.reset}\n`);
    await ask('Press Enter to continue anyway...');
  }
}

// ------------------- AUTH ACTIONS -------------------

async function menuAuth() {
  printHeader();
  console.log(`${c.bold}🔐 Authentication & User Switcher${c.reset}`);
  console.log('1. Register New Account (Driver or Merchant)');
  console.log('2. Login with Email & Password');
  console.log('3. Quick Switch to Demo Driver');
  console.log('4. Quick Switch to Demo Merchant');
  console.log('5. View My Full Profile');
  console.log('6. Logout');
  console.log('0. Back to Main Menu');

  const choice = await ask('\nSelect an option:');
  switch (choice) {
    case '1': {
      const name = await ask('Name:');
      const email = await ask('Email:');
      const password = await ask('Password:');
      const phone = await ask('Phone:');
      const role = (await ask('Role (driver / merchant):')).toLowerCase();

      let extra = {};
      if (role === 'driver') {
        extra.vehicle_type = await ask('Vehicle Type (e.g. 53ft Trailer):');
        extra.max_capacity = parseFloat(await ask('Max Capacity (pallets/tons):')) || 24;
      } else {
        extra.business_name = await ask('Business Name:');
        extra.business_address = await ask('Business Address:');
      }

      const res = await api('/auth/signup', {
        method: 'POST',
        body: { name, email, password, phone, role, ...extra }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        currentToken = res.data.token;
        currentUser = res.data.user;
        console.log(`${c.green}✅ Signed up and logged in as ${currentUser.name}!${c.reset}`);
      }
      break;
    }
    case '2': {
      const email = await ask('Email:');
      const password = await ask('Password:');
      const res = await api('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        currentToken = res.data.token;
        currentUser = res.data.user;
        console.log(`${c.green}✅ Logged in successfully!${c.reset}`);
      }
      break;
    }
    case '3': {
      // Demo Driver
      const res = await api('/auth/login', {
        method: 'POST',
        body: { email: 'demo_driver@yoki.test', password: 'password123' }
      });
      if (res.error) {
        // Auto-create if not exists
        const reg = await api('/auth/signup', {
          method: 'POST',
          body: {
            name: 'Dave "Longhaul" Miller',
            email: 'demo_driver@yoki.test',
            password: 'password123',
            phone: '+1-555-0199',
            role: 'driver',
            vehicle_type: '53ft Dry Van Trailer',
            max_capacity: 26
          }
        });
        if (reg.error) {
          console.log(`${c.red}❌ Error: ${reg.error}${c.reset}`);
          break;
        }
        currentToken = reg.data.token;
        currentUser = reg.data.user;
      } else {
        currentToken = res.data.token;
        currentUser = res.data.user;
      }
      console.log(`${c.green}✅ Switched to Demo Driver: ${currentUser.name}${c.reset}`);
      break;
    }
    case '4': {
      // Demo Merchant
      const res = await api('/auth/login', {
        method: 'POST',
        body: { email: 'demo_merchant@yoki.test', password: 'password123' }
      });
      if (res.error) {
        // Auto-create if not exists
        const reg = await api('/auth/signup', {
          method: 'POST',
          body: {
            name: 'Maria Santos',
            email: 'demo_merchant@yoki.test',
            password: 'password123',
            phone: '+1-555-0288',
            role: 'merchant',
            business_name: 'Santos Regional Supermarket',
            business_address: '450 Broad St, Houston TX'
          }
        });
        if (reg.error) {
          console.log(`${c.red}❌ Error: ${reg.error}${c.reset}`);
          break;
        }
        currentToken = reg.data.token;
        currentUser = reg.data.user;
      } else {
        currentToken = res.data.token;
        currentUser = res.data.user;
      }
      console.log(`${c.green}✅ Switched to Demo Merchant: ${currentUser.name}${c.reset}`);
      break;
    }
    case '5': {
      if (!currentToken) {
        console.log(`${c.red}Please log in first.${c.reset}`);
        break;
      }
      const res = await api('/auth/me');
      console.log(JSON.stringify(res.data.user, null, 2));
      break;
    }
    case '6': {
      currentUser = null;
      currentToken = null;
      console.log(`${c.yellow}Logged out.${c.reset}`);
      break;
    }
  }
  await ask('\nPress Enter to continue...');
}

// ------------------- TRIPS ACTIONS -------------------

async function menuTrips() {
  printHeader();
  console.log(`${c.bold}🚛 Trips Management${c.reset}`);
  console.log('1. Browse All Available Trips (with optional filters)');
  console.log('2. Post a New Trip (Drivers only)');
  console.log('3. View My Posted Trips (Drivers only)');
  console.log('4. View Trip Details by ID');
  console.log('5. Cancel a Trip (Drivers only)');
  console.log('0. Back to Main Menu');

  const choice = await ask('\nSelect an option:');
  switch (choice) {
    case '1': {
      const origin = await ask('Filter Origin (or leave empty):');
      const destination = await ask('Filter Destination (or leave empty):');
      const maxPrice = await ask('Max Price per unit (or leave empty):');

      let query = '?status=active';
      if (origin) query += `&origin=${encodeURIComponent(origin)}`;
      if (destination) query += `&destination=${encodeURIComponent(destination)}`;
      if (maxPrice) query += `&max_price=${encodeURIComponent(maxPrice)}`;

      const res = await api(`/trips${query}`);
      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`\nFound ${res.data.trips.length} active trips:\n`);
        console.table(
          res.data.trips.map((t) => ({
            ID: t.id,
            Route: `${t.origin} ➔ ${t.destination}`,
            Date: t.departure_date,
            'Avail Space': `${t.available_space} / ${t.total_space}`,
            Price: `$${t.price_per_unit}`,
            Driver: `${t.driver_name} (⭐ ${t.avg_rating || 0})`
          }))
        );
      }
      break;
    }
    case '2': {
      if (!currentUser || currentUser.role !== 'driver') {
        console.log(`${c.red}❌ You must be logged in as a DRIVER to post a trip.${c.reset}`);
        break;
      }
      const origin = await ask('Origin City/State (e.g. Chicago, IL):');
      const destination = await ask('Destination City/State (e.g. Atlanta, GA):');
      const departure_date = await ask('Departure Date (YYYY-MM-DD):');
      const total_space = parseFloat(await ask('Total Space Available (pallets):'));
      const price_per_unit = parseFloat(await ask('Price Per Pallet ($):'));
      const notes = await ask('Notes (e.g. Refrigerated / dry):');

      const res = await api('/trips', {
        method: 'POST',
        body: { origin, destination, departure_date, total_space, price_per_unit, notes }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ Trip posted successfully! Trip ID: ${res.data.trip.id}${c.reset}`);
      }
      break;
    }
    case '3': {
      if (!currentUser || currentUser.role !== 'driver') {
        console.log(`${c.red}❌ You must be logged in as a DRIVER to view your trips.${c.reset}`);
        break;
      }
      const res = await api(`/trips?driver_id=${currentUser.id}&status=`);
      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`\nYour Trips (${res.data.trips.length}):\n`);
        console.table(
          res.data.trips.map((t) => ({
            ID: t.id,
            Route: `${t.origin} ➔ ${t.destination}`,
            Date: t.departure_date,
            'Avail Space': `${t.available_space}/${t.total_space}`,
            Price: `$${t.price_per_unit}`,
            Status: t.status
          }))
        );
      }
      break;
    }
    case '4': {
      const tripId = await ask('Enter Trip ID:');
      const res = await api(`/trips/${tripId}`);
      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log('\nTrip Details:');
        console.log(JSON.stringify(res.data.trip, null, 2));
      }
      break;
    }
    case '5': {
      if (!currentUser || currentUser.role !== 'driver') {
        console.log(`${c.red}❌ You must be logged in as a DRIVER to cancel a trip.${c.reset}`);
        break;
      }
      const tripId = await ask('Enter Trip ID to cancel:');
      const res = await api(`/trips/${tripId}`, { method: 'DELETE' });
      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ ${res.data.message}${c.reset}`);
      }
      break;
    }
  }
  await ask('\nPress Enter to continue...');
}

// ------------------- BOOKINGS ACTIONS -------------------

async function menuBookings() {
  printHeader();
  console.log(`${c.bold}📋 Bookings & Status Lifecycle${c.reset}`);
  console.log('1. View My Bookings (Driver or Merchant view)');
  console.log('2. Request Space on a Trip (Merchants only)');
  console.log('3. Accept / Decline Booking Request (Drivers only)');
  console.log('4. Update Booking Status (accepted ➔ picked_up ➔ delivered)');
  console.log('0. Back to Main Menu');

  const choice = await ask('\nSelect an option:');
  switch (choice) {
    case '1': {
      if (!currentUser) {
        console.log(`${c.red}Please log in first.${c.reset}`);
        break;
      }
      const res = await api('/bookings');
      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`\nFound ${res.data.bookings.length} Bookings:\n`);
        if (currentUser.role === 'driver') {
          console.table(
            res.data.bookings.map((b) => ({
              ID: b.id,
              TripID: b.trip_id,
              Route: `${b.origin} ➔ ${b.destination}`,
              Merchant: `${b.merchant_name} (${b.business_name || 'N/A'})`,
              Requested: `${b.space_requested} pallets`,
              Status: b.status,
              Date: b.departure_date
            }))
          );
        } else {
          console.table(
            res.data.bookings.map((b) => ({
              ID: b.id,
              TripID: b.trip_id,
              Route: `${b.origin} ➔ ${b.destination}`,
              Driver: `${b.driver_name} (${b.vehicle_type || 'N/A'})`,
              Booked: `${b.space_requested} pallets`,
              Status: b.status,
              Date: b.departure_date
            }))
          );
        }
      }
      break;
    }
    case '2': {
      if (!currentUser || currentUser.role !== 'merchant') {
        console.log(`${c.red}❌ You must be logged in as a MERCHANT to request booking.${c.reset}`);
        break;
      }
      const trip_id = parseInt(await ask('Trip ID to book:'), 10);
      const space_requested = parseFloat(await ask('Pallets of space requested:'));

      const res = await api('/bookings', {
        method: 'POST',
        body: { trip_id, space_requested }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ Booking request submitted! Booking ID: ${res.data.booking.id}${c.reset}`);
        console.log(`Status: ${c.yellow}${res.data.booking.status}${c.reset} (Waiting for driver approval)`);
      }
      break;
    }
    case '3': {
      if (!currentUser || currentUser.role !== 'driver') {
        console.log(`${c.red}❌ You must be logged in as a DRIVER to accept or decline requests.${c.reset}`);
        break;
      }
      const bookingId = await ask('Booking ID:');
      const action = (await ask('Action (accept / decline):')).toLowerCase();

      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      const res = await api(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: { status: newStatus }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ Booking status updated to "${newStatus}"!${c.reset}`);
        if (newStatus === 'accepted') {
          console.log(`${c.cyan}💬 In-app chat has been unlocked for this booking!${c.reset}`);
        }
      }
      break;
    }
    case '4': {
      if (!currentUser || currentUser.role !== 'driver') {
        console.log(`${c.red}❌ You must be logged in as a DRIVER to update delivery status.${c.reset}`);
        break;
      }
      const bookingId = await ask('Booking ID:');
      console.log('Available transitions:');
      console.log(' - picked_up (driver loaded cargo at merchant warehouse)');
      console.log(' - delivered (cargo successfully arrived at destination)');
      const nextStatus = await ask('Enter new status (picked_up / delivered):');

      const res = await api(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: { status: nextStatus }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ Status successfully advanced to: ${nextStatus}!${c.reset}`);
        if (nextStatus === 'delivered') {
          console.log(`${c.yellow}⭐ Reviews are now unlocked for both parties!${c.reset}`);
        }
      }
      break;
    }
  }
  await ask('\nPress Enter to continue...');
}

// ------------------- CHAT ACTIONS -------------------

async function menuChat() {
  printHeader();
  console.log(`${c.bold}💬 In-App Messages (Accepted Bookings Only)${c.reset}`);
  console.log('1. Read Chat Thread for a Booking');
  console.log('2. Send Message in a Booking Thread');
  console.log('0. Back to Main Menu');

  const choice = await ask('\nSelect an option:');
  switch (choice) {
    case '1': {
      if (!currentUser) {
        console.log(`${c.red}Please log in first.${c.reset}`);
        break;
      }
      const bookingId = await ask('Booking ID:');
      const res = await api(`/messages/${bookingId}`);

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`\nChat History for Booking #${bookingId} (${res.data.messages.length} messages):\n`);
        if (res.data.messages.length === 0) {
          console.log(`${c.dim}(No messages sent yet)${c.reset}`);
        } else {
          for (const msg of res.data.messages) {
            const isMe = msg.sender_id === currentUser.id;
            const senderTag = isMe ? `${c.green}[You]` : `${c.blue}[${msg.sender_name} - ${msg.sender_role}]`;
            console.log(`${senderTag} ${c.white}${msg.content}${c.reset} ${c.dim}(${msg.created_at})${c.reset}`);
          }
        }
      }
      break;
    }
    case '2': {
      if (!currentUser) {
        console.log(`${c.red}Please log in first.${c.reset}`);
        break;
      }
      const bookingId = await ask('Booking ID:');
      const content = await ask('Message to send:');

      const res = await api(`/messages/${bookingId}`, {
        method: 'POST',
        body: { content }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ Message sent successfully!${c.reset}`);
      }
      break;
    }
  }
  await ask('\nPress Enter to continue...');
}

// ------------------- REVIEWS ACTIONS -------------------

async function menuReviews() {
  printHeader();
  console.log(`${c.bold}⭐ Reviews & Ratings (Delivered Bookings Only)${c.reset}`);
  console.log('1. Leave a Review for a Delivered Booking');
  console.log('2. View User Reviews & Reputation');
  console.log('0. Back to Main Menu');

  const choice = await ask('\nSelect an option:');
  switch (choice) {
    case '1': {
      if (!currentUser) {
        console.log(`${c.red}Please log in first.${c.reset}`);
        break;
      }
      const booking_id = parseInt(await ask('Delivered Booking ID:'), 10);
      const rating = parseInt(await ask('Rating (1 to 5 stars):'), 10);
      const comment = await ask('Comment / Review:');

      const res = await api('/reviews', {
        method: 'POST',
        body: { booking_id, rating, comment }
      });

      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        console.log(`${c.green}✅ Review submitted successfully!${c.reset}`);
        console.log(
          `Recipient's Updated Rating: ⭐ ${res.data.reviewee_stats.avg_rating} (${res.data.reviewee_stats.total_reviews} total reviews)`
        );
      }
      break;
    }
    case '2': {
      const userId = await ask('Enter User ID:');
      const res = await api(`/reviews/user/${userId}`);
      if (res.error) {
        console.log(`${c.red}❌ Error: ${res.error}${c.reset}`);
      } else {
        const u = res.data.user;
        console.log(`\nUser: ${u.name} (${u.role.toUpperCase()}) | Average Rating: ⭐ ${u.avg_rating} (${u.total_reviews} reviews)`);
        console.log(`\nReview Comments (${res.data.reviews.length}):`);
        for (const r of res.data.reviews) {
          console.log(` - ⭐ ${r.rating}/5 from ${r.reviewer_name}: "${r.comment || 'No comment'}" (${r.created_at})`);
        }
      }
      break;
    }
  }
  await ask('\nPress Enter to continue...');
}

// ------------------- 1-CLICK DEMO SEED -------------------

async function seedDemoData() {
  printHeader();
  console.log(`${c.bold}🌱 1-Click Demo Data Generator${c.reset}`);
  console.log('This will create:');
  console.log('  • 2 Drivers ("Dave Miller", "Elena Rostova")');
  console.log('  • 2 Merchants ("Maria Santos", "Tom Green Grocers")');
  console.log('  • 3 Realistic Cross-Country Trips (Dallas ➔ Chicago, LA ➔ Phoenix, Atlanta ➔ Miami)');
  console.log('  • 1 Accepted Booking with live chat messages ready');
  console.log('  • 1 Delivered Booking with rating ready to test\n');

  const confirm = await ask('Generate demo data? (y/n):');
  if (confirm.toLowerCase() !== 'y') return;

  try {
    // 1. Create Drivers
    const d1 = await api('/auth/signup', {
      method: 'POST',
      body: {
        name: 'Dave "Longhaul" Miller',
        email: `dave_${Date.now()}@yoki.test`,
        password: 'password123',
        phone: '+1-555-0101',
        role: 'driver',
        vehicle_type: '53ft Dry Van',
        max_capacity: 26
      }
    });

    const d2 = await api('/auth/signup', {
      method: 'POST',
      body: {
        name: 'Elena Rostova',
        email: `elena_${Date.now()}@yoki.test`,
        password: 'password123',
        phone: '+1-555-0102',
        role: 'driver',
        vehicle_type: 'Reefer (Temperature Controlled)',
        max_capacity: 22
      }
    });

    // 2. Create Merchants
    const m1 = await api('/auth/signup', {
      method: 'POST',
      body: {
        name: 'Maria Santos',
        email: `maria_${Date.now()}@yoki.test`,
        password: 'password123',
        phone: '+1-555-0201',
        role: 'merchant',
        business_name: 'Santos Mexican Food Imports',
        business_address: '100 Main St, Chicago IL'
      }
    });

    // 3. Post Trips using Driver 1
    const originalToken = currentToken;
    currentToken = d1.data.token;

    const t1 = await api('/trips', {
      method: 'POST',
      body: {
        origin: 'Dallas, TX',
        destination: 'Chicago, IL',
        departure_date: '2026-10-05',
        total_space: 14,
        price_per_unit: 140,
        notes: 'Dry goods only. Forklift accessible dock loading.'
      }
    });

    const t2 = await api('/trips', {
      method: 'POST',
      body: {
        origin: 'Atlanta, GA',
        destination: 'Miami, FL',
        departure_date: '2026-10-08',
        total_space: 10,
        price_per_unit: 110,
        notes: 'Return trip back haul space available.'
      }
    });

    // Post Trip using Driver 2
    currentToken = d2.data.token;
    const t3 = await api('/trips', {
      method: 'POST',
      body: {
        origin: 'Los Angeles, CA',
        destination: 'Phoenix, AZ',
        departure_date: '2026-10-03',
        total_space: 8,
        price_per_unit: 95,
        notes: 'Cold chain / refrigerated freight.'
      }
    });

    // 4. Create a Booking with Merchant
    currentToken = m1.data.token;
    const b1 = await api('/bookings', {
      method: 'POST',
      body: { trip_id: t1.data.trip.id, space_requested: 5 }
    });

    // 5. Driver 1 accepts booking
    currentToken = d1.data.token;
    await api(`/bookings/${b1.data.booking.id}/status`, {
      method: 'PUT',
      body: { status: 'accepted' }
    });

    // 6. Add some messages
    await api(`/messages/${b1.data.booking.id}`, {
      method: 'POST',
      body: { content: 'Hi Dave, can we load 5 pallets of canned goods on Monday?' }
    });
    currentToken = d1.data.token;
    await api(`/messages/${b1.data.booking.id}`, {
      method: 'POST',
      body: { content: 'Yes Maria! Be at dock 2 by 9 AM and we will get you loaded.' }
    });

    // Set active session to Merchant 1
    currentToken = m1.data.token;
    currentUser = m1.data.user;

    console.log(`${c.green}✅ Demo data generated successfully!${c.reset}`);
    console.log(`Current active user: ${c.bold}${currentUser.name}${c.reset} (Merchant)`);
  } catch (err) {
    console.log(`${c.red}❌ Error during seeding: ${err.message}${c.reset}`);
  }
  await ask('\nPress Enter to continue...');
}

// ------------------- MAIN LOOP -------------------

async function main() {
  await checkServerHealth();

  while (true) {
    printHeader();
    console.log(`${c.bold}What would you like to test?${c.reset}\n`);
    console.log(`1. 🔐 ${c.bold}Auth & User Switcher${c.reset} (Register, Login, Switch Driver ⇄ Merchant)`);
    console.log(`2. 🚛 ${c.bold}Trips${c.reset} (Post trips, Browse, Filter by destination & price)`);
    console.log(`3. 📋 ${c.bold}Bookings${c.reset} (Request space, Accept/Decline, Advance status)`);
    console.log(`4. 💬 ${c.bold}In-App Chat${c.reset} (Read & send live messages)`);
    console.log(`5. ⭐ ${c.bold}Reviews & Ratings${c.reset} (Leave reviews, Check trust scores)`);
    console.log(`6. 🌱 ${c.bold}1-Click Demo Data Seed${c.reset} (Instantly populate realistic data)`);
    console.log(`0. 🚪 Exit\n`);

    const choice = await ask('Enter choice [0-6]:');
    if (choice === '0') {
      console.log('\nGoodbye! 👋\n');
      rl.close();
      process.exit(0);
    }

    switch (choice) {
      case '1':
        await menuAuth();
        break;
      case '2':
        await menuTrips();
        break;
      case '3':
        await menuBookings();
        break;
      case '4':
        await menuChat();
        break;
      case '5':
        await menuReviews();
        break;
      case '6':
        await seedDemoData();
        break;
      default:
        await ask('Invalid option. Press Enter to try again...');
    }
  }
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
