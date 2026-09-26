import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  MapPin,
  Truck,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  Store
} from 'lucide-react';
import { geocode, getRoute } from '../../services/routing';

// Registered local merchants in Kerala for route proximity matching
const KERALA_MERCHANTS = [
  {
    name: 'Travancore Spices',
    location: 'Kanjirappally, Kerala',
    matchKeywords: ['kanjirappally', 'travancore'],
    coords: [76.78975, 9.55451],
  },
  {
    name: 'Vembanad Coir Exporters',
    location: 'Alappuzha, Kerala',
    matchKeywords: ['alappuzha', 'vembanad', 'alleppey'],
    coords: [76.3388, 9.4981],
  },
  {
    name: 'Malabar Hardware',
    location: 'Thrissur, Kerala',
    matchKeywords: ['thrissur', 'malabar'],
    coords: [76.2144, 10.5276],
  },
  {
    name: 'Highrange Cardamom Hub',
    location: 'Adimali, Kerala',
    matchKeywords: ['adimali', 'highrange', 'munnar'],
    coords: [76.9535, 10.0150],
  },
];

export default function RouteMap({
  origin = 'Dallas, TX',
  destination = 'Chicago, IL',
  status = 'picked_up', // requested, accepted, picked_up, delivered
  progress = 55, // 0 - 100%
  vehicleType = '53ft Semi Trailer',
  merchants = [],
  merchantLocation = null,
  notes = '',
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const routeLayersRef = useRef([]);

  const [mapMode, setMapMode] = useState('map'); // 'map' | 'satellite'
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const [activeMerchants, setActiveMerchants] = useState([]);
  const [nearbyMerchantInfo, setNearbyMerchantInfo] = useState(null);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [20, 0],
        zoom: 2,
        maxZoom: 18,
        minZoom: 3,
      });

      // OpenStreetMap Tiles (Fast, 100% reliable, never blocked by adblockers/privacy shields)
      const tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }
      ).addTo(map);

      mapInstanceRef.current = map;
      tileLayerRef.current = tileLayer;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch between Road Map & Satellite Imagery
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (mapMode === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, subdomains: ['a', 'b', 'c'] }
      ).addTo(mapInstanceRef.current);
    }
  }, [mapMode]);

  // Fetch real road coordinates and draw turn-by-turn route + merchant markers
  useEffect(() => {
    let isCancelled = false;

    async function updateRoute() {
      if (!mapInstanceRef.current) return;
      setLoading(true);

      try {
        // Normalize merchant locations
        const merchantItems = [];
        if (Array.isArray(merchants)) {
          merchants.forEach((m) => {
            if (!m) return;
            if (typeof m === 'string' && m.trim()) {
              merchantItems.push({ address: m.trim(), name: 'Merchant Hub' });
            } else if (typeof m === 'object') {
              const addr = m.pickup_location || m.business_address || m.pickup_address || m.address || m.location;
              if (addr && typeof addr === 'string' && addr.trim()) {
                merchantItems.push({
                  ...m,
                  address: addr.trim(),
                  name: m.name || m.merchant_name || 'Merchant',
                  business_name: m.business_name || '',
                });
              }
            }
          });
        }
        if (merchantLocation) {
          if (typeof merchantLocation === 'string' && merchantLocation.trim()) {
            merchantItems.push({ address: merchantLocation.trim(), name: 'Merchant Hub' });
          } else if (typeof merchantLocation === 'object') {
            const addr = merchantLocation.pickup_location || merchantLocation.business_address || merchantLocation.pickup_address || merchantLocation.address || merchantLocation.location;
            if (addr && typeof addr === 'string' && addr.trim()) {
              merchantItems.push({
                ...merchantLocation,
                address: addr.trim(),
                name: merchantLocation.name || merchantLocation.merchant_name || 'Merchant',
                business_name: merchantLocation.business_name || '',
              });
            }
          }
        }

        // Check for nearby corridor merchant if no explicit bookings
        let foundNearby = null;
        if (merchantItems.length === 0) {
          const searchText = `${origin} ${destination} ${notes}`.toLowerCase();
          for (const m of KERALA_MERCHANTS) {
            if (m.matchKeywords.some((k) => searchText.includes(k))) {
              const isOrigin = origin.toLowerCase().includes(m.matchKeywords[0]);
              const isDest = destination.toLowerCase().includes(m.matchKeywords[0]);
              if (!isOrigin && !isDest) {
                foundNearby = m;
                merchantItems.push({
                  address: m.location,
                  name: m.name,
                  business_name: m.name,
                  isNearbyMatch: true,
                });
                break;
              }
            }
          }
        }
        setNearbyMerchantInfo(foundNearby);

        // 1. Geocode origin, destination, and merchants
        const merchantGeocodePromises = merchantItems.map(async (m) => {
          try {
            if (m.coords) {
              return { ...m, coords: [m.coords[1], m.coords[0]] };
            }
            const coords = await geocode(m.address);
            if (coords && Array.isArray(coords)) {
              return { ...m, coords: [coords[1], coords[0]] }; // [lat, lng] for Leaflet
            }
          } catch (err) {
            console.warn('Geocoding error for merchant:', m.address, err);
          }
          return null;
        });

        const [startCoords, endCoords, ...geocodedMerchants] = await Promise.all([
          geocode(origin),
          geocode(destination),
          ...merchantGeocodePromises,
        ]);

        if (isCancelled || !startCoords || !endCoords) {
          setLoading(false);
          return;
        }

        const validMerchants = geocodedMerchants.filter(Boolean);
        setActiveMerchants(validMerchants);

        // 2. Fetch real turn-by-turn highway directions from OpenRouteService / OSRM
        const result = await getRoute(startCoords, endCoords);

        if (isCancelled || !result || !result.coordinates?.length) {
          setLoading(false);
          return;
        }

        setRouteInfo(result);

        const map = mapInstanceRef.current;

        // Clean up previous polylines & markers
        routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
        routeLayersRef.current = [];

        // 3. Draw active real route polyline (with glow casing)
        const outerGlow = L.polyline(result.coordinates, {
          color: mapMode === 'satellite' ? '#0ea5e9' : '#1D4ED8',
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        const innerRoute = L.polyline(result.coordinates, {
          color: mapMode === 'satellite' ? '#38bdf8' : '#2563EB',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        routeLayersRef.current.push(outerGlow, innerRoute);

        // 4. Custom Origin Marker (Dallas / Kottayam)
        const originLatLng = result.coordinates[0];
        const originIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
              <div style="background:#1B4332; color:white; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.3); border:1.5px solid white; display:flex; align-items:center; gap:5px;">
                <span style="width:6px; height:6px; background:#4ade80; border-radius:50%; display:inline-block;"></span>
                <span>${origin}</span>
              </div>
              <div style="width:10px; height:10px; background:#1B4332; border:2px solid white; border-radius:50%; margin-top:-2px; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [0, 0],
        });
        const originMarker = L.marker(originLatLng, { icon: originIcon }).addTo(map);
        routeLayersRef.current.push(originMarker);

        // 5. Custom Destination Marker (Chicago / Kanjirappally)
        const destLatLng = result.coordinates[result.coordinates.length - 1];
        const destIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
              <div style="background:#DC2626; color:white; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.3); border:1.5px solid white; display:flex; align-items:center; gap:5px;">
                <span style="width:6px; height:6px; background:#fde047; border-radius:50%; display:inline-block;"></span>
                <span>${destination}</span>
              </div>
              <div style="width:10px; height:10px; background:#DC2626; border:2px solid white; border-radius:50%; margin-top:-2px; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
            </div>
          `,
          iconSize: [0, 0],
        });
        const destMarker = L.marker(destLatLng, { icon: destIcon }).addTo(map);
        routeLayersRef.current.push(destMarker);

        // 6. Custom Merchant Location Markers with stylish Amber Badge and Popup
        validMerchants.forEach((m, idx) => {
          const displayName = m.business_name || m.name || `Merchant #${idx + 1}`;
          const isAccepted = m.status === 'accepted';
          const isPickedUp = m.status === 'picked_up';
          const isDelivered = m.status === 'delivered';

          const merchantIcon = L.divIcon({
            className: 'custom-merchant-marker',
            html: `
              <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor:pointer;">
                <div style="background:#B45309; color:white; padding:4px 9px; border-radius:12px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 4px 14px rgba(180,83,9,0.45); border:2px solid #FEF3C7; display:flex; align-items:center; gap:5px; transition:transform 0.15s ease;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; background:#FDE68A; color:#78350F; border-radius:50%; font-size:10px;">🏪</span>
                  <span>${displayName}</span>
                  ${m.space_requested ? `<span style="background:rgba(255,255,255,0.25); font-size:9px; padding:1px 5px; border-radius:6px;">${m.space_requested}p</span>` : ''}
                </div>
                <div style="width:12px; height:12px; background:#D97706; border:2.5px solid white; border-radius:50%; margin-top:-3px; box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
              </div>
            `,
            iconSize: [0, 0],
          });

          const merchantMarker = L.marker(m.coords, { icon: merchantIcon }).addTo(map);

          const popupHtml = `
            <div style="font-family:system-ui,-apple-system,sans-serif; min-width:200px; padding:4px;">
              <div style="display:inline-flex; align-items:center; gap:4px; background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:bold; text-transform:uppercase; margin-bottom:5px;">
                <span>🏪</span>
                <span>${m.isNearbyMatch ? 'Corridor Merchant Hub' : 'Merchant Cargo Hub'}</span>
              </div>
              <div style="font-weight:800; font-size:13px; color:#0f172a; line-height:1.2;">
                ${displayName}
              </div>
              ${m.business_name && m.name && m.business_name !== m.name ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">Contact: <strong>${m.name}</strong></div>` : ''}
              <div style="font-size:11px; color:#475569; margin-top:5px; display:flex; align-items:flex-start; gap:4px; line-height:1.3;">
                <span style="color:#d97706;">📍</span>
                <span>${m.address}</span>
              </div>
              ${m.space_requested ? `
                <div style="margin-top:6px; padding-top:6px; border-top:1px solid #e2e8f0; font-size:11px; color:#1e293b; display:flex; justify-content:space-between; align-items:center;">
                  <span style="color:#64748b;">Cargo Requested:</span>
                  <strong style="color:#047857; font-weight:700;">${m.space_requested} pallets</strong>
                </div>
              ` : ''}
              ${m.status ? `
                <div style="margin-top:5px; font-size:10px; font-weight:700; color:${isDelivered ? '#7e22ce' : isPickedUp ? '#2563eb' : isAccepted ? '#047857' : '#d97706'}; text-transform:uppercase;">
                  Status: ${m.status}
                </div>
              ` : ''}
            </div>
          `;
          merchantMarker.bindPopup(popupHtml);
          routeLayersRef.current.push(merchantMarker);

          // Dashed waypoint connector from merchant location to the closest route highway point
          if (result.coordinates && result.coordinates.length > 0) {
            let nearestPt = result.coordinates[0];
            let minD = Infinity;
            for (const pt of result.coordinates) {
              const d = (pt[0] - m.coords[0]) ** 2 + (pt[1] - m.coords[1]) ** 2;
              if (d < minD) {
                minD = d;
                nearestPt = pt;
              }
            }
            if (minD > 0.0001) {
              const connector = L.polyline([nearestPt, m.coords], {
                color: '#D97706',
                weight: 2.5,
                dashArray: '4, 6',
                opacity: 0.85,
              }).addTo(map);
              routeLayersRef.current.push(connector);
            }
          }
        });

        // 7. Live Truck Marker positioned along route
        if (status !== 'requested') {
          const progressIndex = Math.min(
            result.coordinates.length - 1,
            Math.max(0, Math.floor((result.coordinates.length - 1) * (progress / 100)))
          );
          const truckLatLng = result.coordinates[progressIndex];

          const truckIcon = L.divIcon({
            className: 'custom-truck-marker',
            html: `
              <div style="position:relative; display:flex; align-items:center; justify-content:center; transform: translate(-50%, -50%);">
                <div style="position:absolute; width:34px; height:34px; border-radius:50%; background:#3b82f6; opacity:0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width:28px; height:28px; border-radius:50%; background:#2563eb; border:2.5px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
              </div>
            `,
            iconSize: [0, 0],
          });
          const truckMarker = L.marker(truckLatLng, { icon: truckIcon }).addTo(map);
          routeLayersRef.current.push(truckMarker);
        }

        // 8. AUTOMATIC PERFECT ZOOM IN (Fits route AND all merchant locations)
        const allCoords = [...result.coordinates, ...validMerchants.map((m) => m.coords)];
        const fitBounds = L.latLngBounds(allCoords);
        map.fitBounds(fitBounds, {
          padding: [55, 55],
          maxZoom: 14,
          animate: true,
          duration: 0.8,
        });

      } catch (err) {
        console.warn('Map route drawing error:', err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    updateRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    origin,
    destination,
    status,
    progress,
    notes,
    mapMode,
    JSON.stringify(merchants),
    JSON.stringify(merchantLocation)
  ]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (mapInstanceRef.current && routeLayersRef.current.length > 0) {
      const group = L.featureGroup(
        routeLayersRef.current.filter((l) => typeof l.getBounds === 'function' || typeof l.getLatLng === 'function')
      );
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[380px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm select-none ${className}`}>
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-xs">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-xl border border-slate-200 text-xs font-bold text-slate-800">
            <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            <span>Calculating highway corridor & merchant pins...</span>
          </div>
        </div>
      )}

      {/* Top-Right: Map / Satellite Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full border border-slate-200 shadow-md z-10">
        <button
          onClick={() => setMapMode('map')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            mapMode === 'map'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setMapMode('satellite')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            mapMode === 'satellite'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Top-Left: Real Highway Distance & ETA badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[280px]">
        {routeInfo && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
            <div className="w-7 h-7 rounded-xl bg-forest-700 text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Navigation className="w-4 h-4 rotate-45" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                {routeInfo.distanceKm} • {routeInfo.duration}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                Route via {routeInfo.source}
              </p>
            </div>
          </div>
        )}

        {/* Merchant Location Tag badge */}
        {activeMerchants.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-amber-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div className="truncate">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">
                  {activeMerchants.length === 1
                    ? `${activeMerchants[0].business_name || activeMerchants[0].name}`
                    : `${activeMerchants.length} Merchant Pickups`}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Nearby Corridor Merchant Hint if matched */}
        {nearbyMerchantInfo && activeMerchants.length === 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white shadow-md border border-amber-400 text-[11px] font-bold">
            <span>🏪</span>
            <span className="truncate">
              Passes near: <span className="underline">{nearbyMerchantInfo.name}</span> ({nearbyMerchantInfo.location.split(',')[0]})
            </span>
          </div>
        )}
      </div>

      {/* Bottom-Right: Interactive Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1.5 z-10">
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition border-b border-slate-100"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleRecenter}
          title="Recenter and auto-fit route & merchant pins"
          className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-slate-950 shadow-md transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom-Left: Live Freight Status Pill */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md z-10 max-w-[calc(100%-80px)] overflow-x-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 shrink-0">
          <Truck className="w-4 h-4 text-forest-700" />
          <span>{vehicleType}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
        <div className="text-xs font-extrabold text-forest-700 shrink-0">
          {status === 'delivered'
            ? '100% Delivered'
            : status === 'picked_up'
            ? `${progress}% In Transit`
            : 'Scheduled Route'}
        </div>

        {activeMerchants.length > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Merchant Pickup Mapped</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
