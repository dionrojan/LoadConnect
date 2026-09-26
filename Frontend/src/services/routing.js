// Routing and Geocoding service using OpenRouteService with OSRM & Nominatim fallbacks
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY || '';

// High-speed local cache for common towns to ensure instant zero-latency rendering
const KNOWN_PLACES = {
  kanjirappally: { name: 'Kanjirappally, Kerala', coords: [76.78975, 9.55451] },
  kottayam: { name: 'Kottayam, Kerala', coords: [76.52215, 9.59157] },
  kochi: { name: 'Kochi, Kerala', coords: [76.2673, 9.9312] },
  trivandrum: { name: 'Thiruvananthapuram, Kerala', coords: [76.9366, 8.5241] },
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

  // 1. Check local cache
  if (KNOWN_PLACES[clean]) {
    return KNOWN_PLACES[clean].coords;
  }
  for (const [key, val] of Object.entries(KNOWN_PLACES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val.coords;
    }
  }

  // 2. Query OpenRouteService Geocoding
  if (ORS_KEY) {
    try {
      const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_KEY}&text=${encodeURIComponent(placeName)}&size=1`;
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

  // 3. Fallback to Nominatim (OpenStreetMap)
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
        const route = data?.routes?.[0];
        if (route) {
          const distKm = (route.summary.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.summary.duration / 60);
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

          // GeoJSON coordinates are [lng, lat] -> Leaflet wants [lat, lng]
          const latLngs = route.geometry.map(([lng, lat]) => [lat, lng]);

          return {
            distanceKm: `${distKm} km`,
            distanceRaw: distKm,
            duration: durationFormatted,
            coordinates: latLngs, // [ [lat, lng], ... ]
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
