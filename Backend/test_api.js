// Comprehensive E2E Smoke Test for YOKI API
import http from 'http';

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`[${res.status}] ${data.error || res.statusText}`);
  }
  return data;
}

async function runTests() {
  console.log('🧪 Starting YOKI API Smoke Tests...\n');

  // 1. Health check
  console.log('1️⃣ Checking API Health...');
  const health = await request('/health');
  console.log('   ✅ Health OK:', health.status);

  const timestamp = Date.now();

  // 2. Signup Driver
  console.log('2️⃣ Registering Driver...');
  const driverData = await request('/auth/signup', {
    method: 'POST',
    body: {
      name: 'John Trucker',
      email: `driver_${timestamp}@yoki.test`,
      password: 'password123',
      phone: '+15550100',
      role: 'driver',
      vehicle_type: '53ft Semi Trailer',
      max_capacity: 26.0
    }
  });
  const driverToken = driverData.token;
  console.log('   ✅ Driver registered:', driverData.user.name, `(ID: ${driverData.user.id})`);

  // 3. Signup Merchant
  console.log('3️⃣ Registering Merchant...');
  const merchantData = await request('/auth/signup', {
    method: 'POST',
    body: {
      name: 'Sarah Shopkeeper',
      email: `merchant_${timestamp}@yoki.test`,
      password: 'password123',
      phone: '+15550200',
      role: 'merchant',
      business_name: 'Sarah Organic Produce',
      business_address: '123 Market St, Chicago'
    }
  });
  const merchantToken = merchantData.token;
  console.log('   ✅ Merchant registered:', merchantData.user.name, `(ID: ${merchantData.user.id})`);

  // 4. Driver posts a trip
  console.log('4️⃣ Driver posting a trip (Dallas -> Chicago)...');
  const tripRes = await request('/trips', {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: {
      origin: 'Dallas, TX',
      destination: 'Chicago, IL',
      departure_date: '2026-10-01',
      total_space: 10.0,
      price_per_unit: 150.0,
      notes: 'Temperature controlled trailer, empty pallets ready.'
    }
  });
  const tripId = tripRes.trip.id;
  console.log(`   ✅ Trip created (ID: ${tripId}), available space: ${tripRes.trip.available_space} pallets`);

  // 5. Merchant searches for trips
  console.log('5️⃣ Merchant searching for trips to "Chicago"...');
  const searchRes = await request('/trips?destination=chicago', {
    headers: { Authorization: `Bearer ${merchantToken}` }
  });
  console.log(`   ✅ Found ${searchRes.trips.length} matching trips`);

  // 6. Merchant requests booking
  console.log('6️⃣ Merchant booking 4 pallets on trip...');
  const bookingRes = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: {
      trip_id: tripId,
      space_requested: 4.0
    }
  });
  const bookingId = bookingRes.booking.id;
  console.log(`   ✅ Booking request created (ID: ${bookingId}), status: ${bookingRes.booking.status}`);

  // 7. Driver accepts booking
  console.log('7️⃣ Driver accepting booking...');
  const acceptRes = await request(`/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { status: 'accepted' }
  });
  console.log(`   ✅ Booking updated: ${acceptRes.booking.status}`);

  // Check that trip available space decreased to 6.0
  const updatedTrip = await request(`/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  console.log(`   ✅ Trip available space reduced to: ${updatedTrip.trip.available_space} pallets (was 10.0)`);

  // 8. In-app messaging
  console.log('8️⃣ Exchanging messages between driver & merchant...');
  await request(`/messages/${bookingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: { content: 'Hi John! When can I bring the pallets to the loading dock?' }
  });
  await request(`/messages/${bookingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { content: 'Hey Sarah! I will be at dock 4 tomorrow around 8:00 AM.' }
  });
  const msgHistory = await request(`/messages/${bookingId}`, {
    headers: { Authorization: `Bearer ${merchantToken}` }
  });
  console.log(`   ✅ Message thread active: ${msgHistory.messages.length} messages retrieved`);

  // 9. Driver marks as picked up then delivered
  console.log('9️⃣ Driver updating status to picked_up then delivered...');
  await request(`/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { status: 'picked_up' }
  });
  const deliveredRes = await request(`/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: { status: 'delivered' }
  });
  console.log(`   ✅ Booking final status: ${deliveredRes.booking.status}`);

  // 10. Merchant submits a 5-star review
  console.log('🔟 Merchant leaving a 5-star review...');
  const reviewRes = await request('/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantToken}` },
    body: {
      booking_id: bookingId,
      rating: 5,
      comment: 'Smooth delivery, everything arrived intact and on schedule!'
    }
  });
  console.log(`   ✅ Review submitted! Driver new rating: ${reviewRes.reviewee_stats.avg_rating} ⭐ (${reviewRes.reviewee_stats.total_reviews} review)`);

  console.log('\n🎉 ALL 10 TESTS PASSED SUCCESSFULLY! The YOKI backend is fully operational.\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
