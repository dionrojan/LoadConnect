// Routing and Geocoding service using OpenRouteService with OSRM & Nominatim fallbacks
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY || '';

// High-speed local cache for common freight hubs and demo cities for instant zero-latency rendering
const KNOWN_PLACES = {
  kanjirappally: { name: 'Kanjirappally, Kerala', coords: [76.78975, 9.55451] },
  kottayam: { name: 'Kottayam, Kerala', coords: [76.52215, 9.59157] },
  kochi: { name: 'Kochi, Kerala', coords: [76.2673, 9.9312] },
  ernakulam: { name: 'Ernakulam, Kerala', coords: [76.2999, 9.9816] },
  alappuzha: { name: 'Alappuzha, Kerala', coords: [76.3388, 9.4981] },
  alleppey: { name: 'Alappuzha, Kerala', coords: [76.3388, 9.4981] },
  thrissur: { name: 'Thrissur, Kerala', coords: [76.2144, 10.5276] },
  palakkad: { name: 'Palakkad, Kerala', coords: [76.6548, 10.7867] },
  kozhikode: { name: 'Kozhikode, Kerala', coords: [75.7804, 11.2588] },
  calicut: { name: 'Kozhikode, Kerala', coords: [75.7804, 11.2588] },
  kollam: { name: 'Kollam, Kerala', coords: [76.6035, 8.8932] },
  trivandrum: { name: 'Thiruvananthapuram, Kerala', coords: [76.9366, 8.5241] },
  thiruvananthapuram: { name: 'Thiruvananthapuram, Kerala', coords: [76.9366, 8.5241] },
  kannur: { name: 'Kannur, Kerala', coords: [75.3704, 11.8745] },
  kumily: { name: 'Kumily, Kerala', coords: [77.1650, 9.6050] },
  munnar: { name: 'Munnar, Kerala', coords: [77.0595, 10.0889] },
  adimali: { name: 'Adimali, Kerala', coords: [76.9535, 10.0150] },
  kattappana: { name: 'Kattappana, Kerala', coords: [77.1170, 9.7540] },
  changanassery: { name: 'Changanassery, Kerala', coords: [76.5369, 9.4449] },
  thiruvalla: { name: 'Thiruvalla, Kerala', coords: [76.5741, 9.3835] },
  angamaly: { name: 'Angamaly, Kerala', coords: [76.3860, 10.1960] },
  chalakudy: { name: 'Chalakudy, Kerala', coords: [76.3300, 10.3070] },
  ponkunnam: { name: 'Ponkunnam, Kerala', coords: [76.7580, 9.5690] },
  mundakkayam: { name: 'Mundakkayam, Kerala', coords: [76.8850, 9.5370] },
  kayamkulam: { name: 'Kayamkulam, Kerala', coords: [76.5000, 9.1740] },
  coimbatore: { name: 'Coimbatore, Tamil Nadu', coords: [76.9558, 11.0168] },
  dallas: { name: 'Dallas, TX', coords: [-96.7970, 32.7767] },
  'dallas, tx': { name: 'Dallas, TX', coords: [-96.7970, 32.7767] },
  chicago: { name: 'Chicago, IL', coords: [-87.6298, 41.8781] },
  'chicago, il': { name: 'Chicago, IL', coords: [-87.6298, 41.8781] },
  atlanta: { name: 'Atlanta, GA', coords: [-84.3880, 33.7490] },
  'atlanta, ga': { name: 'Atlanta, GA', coords: [-84.3880, 33.7490] },
  miami: { name: 'Miami, FL', coords: [-80.1918, 25.7617] },
  'miami, fl': { name: 'Miami, FL', coords: [-80.1918, 25.7617] },
  houston: { name: 'Houston, TX', coords: [-95.3698, 29.7604] },
  'houston, tx': { name: 'Houston, TX', coords: [-95.3698, 29.7604] },
  austin: { name: 'Austin, TX', coords: [-97.7431, 30.2672] },
  'austin, tx': { name: 'Austin, TX', coords: [-97.7431, 30.2672] },
  'san antonio': { name: 'San Antonio, TX', coords: [-98.4936, 29.4241] },
  memphis: { name: 'Memphis, TN', coords: [-90.0490, 35.1495] },
  'st. louis': { name: 'St. Louis, MO', coords: [-90.1994, 38.6270] },
  'little rock': { name: 'Little Rock, AR', coords: [-92.2896, 34.7465] },
  'los angeles': { name: 'Los Angeles, CA', coords: [-118.2437, 34.0522] },
  'los angeles, ca': { name: 'Los Angeles, CA', coords: [-118.2437, 34.0522] },
  phoenix: { name: 'Phoenix, AZ', coords: [-112.0740, 33.4484] },
  'phoenix, az': { name: 'Phoenix, AZ', coords: [-112.0740, 33.4484] },
};

/**
 * Geocode place name to [longitude, latitude]
 */
export async function geocode(placeName) {
  if (!placeName || typeof placeName !== 'string') return null;
  const clean = placeName.trim().toLowerCase();

  // 1. Direct exact match in local cache for instant rendering
  if (KNOWN_PLACES[clean]) {
    return KNOWN_PLACES[clean].coords;
  }

  // 2. Query OpenRouteService Geocoding (exact address and pinpoint GIS)
  if (ORS_KEY) {
    try {
      const url = `https://api.openrouteservice.org/geocode/search?api_key=${encodeURIComponent(ORS_KEY)}&text=${encodeURIComponent(placeName)}&size=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data?.features?.length > 0) {
          return data.features[0].geometry.coordinates; // [lng, lat]
        }
      }
    } catch (err) {
      console.warn('ORS geocode warning:', err.message);
    }
  }

  // 3. Fallback: Partial match in local cache
  for (const [key, val] of Object.entries(KNOWN_PLACES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val.coords;
    }
  }

  // 4. Fallback to Nominatim (OpenStreetMap)
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'YOKI-Logistics-Platform' } });
    if (res.ok) {
      const list = await res.json();
      if (list?.length > 0) {
        return [parseFloat(list[0].lon), parseFloat(list[0].lat)];
      }
    }
  } catch (err) {
    console.warn('Nominatim fallback geocode warning:', err.message);
  }

  return null;
}

/**
 * Fetch real driving road route between two coordinates
 * @param {[number, number]} start [lng, lat]
 * @param {[number, number]} end [lng, lat]
 */
export async function getRoute(start, end) {
  if (!start || !end) return null;

  // 1. Try OpenRouteService Driving-Car API with User's Key
  if (ORS_KEY) {
    try {
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
      const res = await fetch(url, {
        headers: {
          Authorization: ORS_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();

        // ORS GET directions returns a GeoJSON FeatureCollection
        const feature = data?.features?.[0];
        const route = data?.routes?.[0];

        if (feature) {
          const summary = feature.properties?.summary || feature.properties?.segments?.[0] || {};
          const distKm = ((summary.distance || 0) / 1000).toFixed(1);
          const durationMins = Math.round((summary.duration || 0) / 60);
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

          // GeoJSON coordinates are [lng, lat] -> Leaflet expects [lat, lng]
          const latLngs = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

          return {
            distanceKm: `${distKm} km`,
            distanceRaw: distKm,
            duration: durationFormatted,
            coordinates: latLngs,
            source: 'OpenRouteService',
          };
        } else if (route) {
          const distKm = (route.summary.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.summary.duration / 60);
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

          const latLngs = Array.isArray(route.geometry)
            ? route.geometry.map(([lng, lat]) => [lat, lng])
            : [];

          return {
            distanceKm: `${distKm} km`,
            distanceRaw: distKm,
            duration: durationFormatted,
            coordinates: latLngs,
            source: 'OpenRouteService',
          };
        }
      }
    } catch (err) {
      console.warn('ORS Route error, falling back to OSRM:', err.message);
    }
  }

  // 2. Fallback to OSRM (100% Free Open Source Routing Machine)
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const route = data?.routes?.[0];
      if (route) {
        const distKm = (route.distance / 1000).toFixed(1);
        const durationMins = Math.round(route.duration / 60);
        const hours = Math.floor(durationMins / 60);
        const mins = durationMins % 60;
        const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        return {
          distanceKm: `${distKm} km`,
          distanceRaw: distKm,
          duration: durationFormatted,
          coordinates: latLngs,
          source: 'OSRM',
        };
      }
    }
  } catch (err) {
    console.warn('OSRM Route error:', err.message);
  }

  // 3. Straight fallback line if both APIs offline
  return {
    distanceKm: 'Direct Route',
    duration: 'Estimated',
    coordinates: [
      [start[1], start[0]],
      [end[1], end[0]],
    ],
    source: 'Direct',
  };
}
