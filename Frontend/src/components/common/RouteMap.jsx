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
  Loader2
} from 'lucide-react';
import { geocode, getRoute } from '../../services/routing';

export default function RouteMap({
  origin = 'Dallas, TX',
  destination = 'Chicago, IL',
  status = 'picked_up', // requested, accepted, picked_up, delivered
  progress = 55, // 0 - 100%
  vehicleType = '53ft Semi Trailer',
  className = ''
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const routeLayersRef = useRef([]);

  const [mapMode, setMapMode] = useState('map'); // 'map' | 'satellite'
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);

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

      // CartoDB Voyager Tiles (Beautiful warm palette matching Reference 2)
      const tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
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
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(mapInstanceRef.current);
    }
  }, [mapMode]);

  // Fetch real road coordinates and draw turn-by-turn route
  useEffect(() => {
    let isCancelled = false;

    async function updateRoute() {
      if (!mapInstanceRef.current) return;
      setLoading(true);

      try {
        // 1. Geocode origin and destination place names
        const [startCoords, endCoords] = await Promise.all([
          geocode(origin),
          geocode(destination),
        ]);

        if (isCancelled || !startCoords || !endCoords) {
          setLoading(false);
          return;
        }

        // 2. Fetch real turn-by-turn highway directions from OpenRouteService
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

        // 6. Live Truck Marker positioned along route
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

        // 7. AUTOMATIC PERFECT ZOOM IN (Fits the entire road route with comfortable margins)
        map.fitBounds(innerRoute.getBounds(), {
          padding: [50, 50],
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
  }, [origin, destination, status, progress, mapMode]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (routeLayersRef.current.length > 0 && mapInstanceRef.current) {
      const polyline = routeLayersRef.current[1] || routeLayersRef.current[0];
      if (polyline?.getBounds) {
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
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
            <span>Calculating real highway route...</span>
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
      {routeInfo && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md">
          <div className="w-7 h-7 rounded-xl bg-forest-700 text-amber-300 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4 rotate-45" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900 leading-tight">
              {routeInfo.distanceKm} • {routeInfo.duration}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Verified road route ({routeInfo.source})
            </p>
          </div>
        </div>
      )}

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
          title="Recenter and auto-fit route"
          className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-slate-950 shadow-md transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom-Left: Live Freight Status Pill */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Truck className="w-4 h-4 text-forest-700" />
          <span>{vehicleType}</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <div className="text-xs font-extrabold text-forest-700">
          {status === 'delivered'
            ? '100% Delivered'
            : status === 'picked_up'
            ? `${progress}% In Transit`
            : 'Scheduled Route'}
        </div>
      </div>
    </div>
  );
}
