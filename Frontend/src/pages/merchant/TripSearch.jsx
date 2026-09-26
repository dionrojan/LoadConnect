import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Phone,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { tripsAPI, bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CapacityMeter from '../../components/common/CapacityMeter';
import RouteMap from '../../components/common/RouteMap';

export default function TripSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search Filters synced with URL
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [minSpace, setMinSpace] = useState(searchParams.get('min_space') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Booking Modal / Request Space Form
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [spaceRequested, setSpaceRequested] = useState(4);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Sync state to URL and fetch
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = {
        origin: origin.trim() || undefined,
        destination: destination.trim() || undefined,
        min_space: minSpace || undefined,
        max_price: maxPrice || undefined,
        status: 'active',
      };

      // update URL search params
      const newParams = {};
      if (origin) newParams.origin = origin;
      if (destination) newParams.destination = destination;
      if (minSpace) newParams.min_space = minSpace;
      if (maxPrice) newParams.max_price = maxPrice;
      setSearchParams(newParams);

      const res = await tripsAPI.getTrips(params);
      if (res?.trips) {
        setTrips(res.trips);
        if (res.trips.length > 0 && !selectedTrip) {
          setSelectedTrip(res.trips[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  // Submit Cargo Booking with Client-Side Validation that Hard-Blocks Overbooking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!selectedTrip) return;

    const requested = parseFloat(spaceRequested);
    if (isNaN(requested) || requested <= 0) {
      setBookingError('Please enter a valid pallet count greater than 0.');
      return;
    }

    // CLIENT-SIDE HARD BLOCK: Cannot exceed available space
    if (requested > selectedTrip.available_space) {
      setBookingError(
        `Requested space (${requested} pallets) exceeds available capacity (${selectedTrip.available_space} pallets).`
      );
      return;
    }

    setSubmittingBooking(true);

    try {
      await bookingsAPI.createBooking({
        trip_id: selectedTrip.id,
        space_requested: requested,
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setIsBookModalOpen(false);
        setBookingSuccess(false);
        navigate('/merchant/bookings');
      }, 1500);
    } catch (err) {
      setBookingError(err.message || 'Failed to submit booking request.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* COLUMN 2 — TRIP DISCOVERY LIST PANEL */}
      {/* ========================================================================= */}
      <section className="w-full lg:w-[360px] xl:w-[390px] shrink-0 border-r border-slate-200/90 flex flex-col justify-between bg-cream-100 overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200/80 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Search className="w-4 h-4 text-forest-700" />
              <span>Freight Discovery</span>
            </h2>
            <button
              onClick={fetchTrips}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Refresh Routes"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Route Inputs */}
          <form onSubmit={handleApplyFilter} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Origin (city/state)"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-cream-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:bg-white"
              />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-cream-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minSpace}
                onChange={(e) => setMinSpace(e.target.value)}
                placeholder="Min pallets"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-cream-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:bg-white"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max $/pallet"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-cream-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition"
            >
              Filter Routes
            </button>
          </form>
        </div>

        {/* Scrollable Trip Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching active freight trips...</div>
          ) : trips.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching freight routes found. Try broadening your search filters.
            </div>
          ) : (
            trips.map((trip) => {
              const isSelected = selectedTrip?.id === trip.id;
              const hasCapacity = trip.available_space > 0;

              return (
                <div
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'bg-white border-forest-600 shadow-md ring-1 ring-forest-600'
                      : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Card Header: Driver Mini-Card & Price */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-[10px]">
                        {trip.driver_name?.charAt(0) || 'D'}
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                        {trip.driver_name}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        ⭐ {trip.avg_rating || 5.0} ({trip.total_reviews || 0})
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-forest-700">
                      ${trip.price_per_unit} <span className="text-[10px] font-normal text-slate-400">/ pallet</span>
                    </span>
                  </div>

                  {/* Route with Start/End Dots (Reference 2 style) */}
                  <div className="space-y-1 my-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-forest-700" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {trip.origin}
                      </span>
                    </div>
                    <div className="ml-1 w-0.5 h-3 bg-slate-200 border-l border-dashed border-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {trip.destination}
                      </span>
                    </div>
                  </div>

                  {/* Date & Vehicle Type */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {trip.departure_date}
                    </span>
                    <span className="truncate max-w-[130px] font-medium text-slate-600">
                      {trip.vehicle_type || '53ft Trailer'}
                    </span>
                  </div>

                  {/* Capacity Meter */}
                  <div className="mt-2.5">
                    <CapacityMeter
                      available={trip.available_space}
                      total={trip.total_space}
                      compact={true}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pinned Bottom CTA Button */}
        <div className="p-3 border-t border-slate-200/90 bg-white">
          <button
            onClick={() => setIsBookModalOpen(true)}
            disabled={!selectedTrip || selectedTrip.available_space <= 0}
            className="w-full py-3 px-4 rounded-2xl bg-[#17181A] hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Package className="w-4 h-4 text-amber-400" />
            Request Cargo Space on Selected Route
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 3 — TRIP DETAILS & LIVE ROUTE MAP (~65% width)                     */}
      {/* ========================================================================= */}
      <section className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
        {selectedTrip ? (
          <div className="p-4 lg:p-6 space-y-5">
            {/* Top Bar: Route Summary */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  #TRIP-{selectedTrip.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedTrip.origin} ➔ {selectedTrip.destination}
                </h3>
              </div>

              <button
                onClick={() => setIsBookModalOpen(true)}
                disabled={selectedTrip.available_space <= 0}
                className="px-5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                Book Pallets
              </button>
            </div>

            {/* Driver Verified Credibility & Cargo Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Driver Mini Card */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-700">Hauler Profile</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-700 text-amber-300 flex items-center justify-center font-bold text-base">
                    {selectedTrip.driver_name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedTrip.driver_name}</h4>
                    <p className="text-xs text-slate-500">{selectedTrip.vehicle_type || '53ft Semi Trailer'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                        ⭐ {selectedTrip.avg_rating || 5.0} Rating
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({selectedTrip.total_reviews || 0} completed hauls)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Departure:</span>
                  <span className="font-bold text-slate-800">{selectedTrip.departure_date}</span>
                </div>
              </div>

              {/* Fractional Capacity Calculator */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Live Price Calculator</span>
                    <span className="text-xs font-extrabold text-forest-700">
                      ${selectedTrip.price_per_unit} / unit
                    </span>
                  </div>

                  <CapacityMeter
                    available={selectedTrip.available_space}
                    total={selectedTrip.total_space}
                  />

                  {/* Quantity Stepper */}
                  <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Pallets needed:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSpaceRequested(Math.max(1, spaceRequested - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold px-2">{spaceRequested}</span>
                      <button
                        onClick={() =>
                          setSpaceRequested(
                            Math.min(selectedTrip.available_space, spaceRequested + 1)
                          )
                        }
                        disabled={spaceRequested >= selectedTrip.available_space}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated Freight Total:</span>
                  <span className="text-base font-extrabold text-forest-800">
                    ${(spaceRequested * selectedTrip.price_per_unit).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {selectedTrip.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block mb-1">Driver's Route & Dock Notes:</span>
                "{selectedTrip.notes}"
              </div>
            )}

            {/* Live GPS Map Strip */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700">Route Map & Corridor Preview</h4>
                <span className="text-[10px] text-slate-400">Verified Interstate Corridor</span>
              </div>
              <div className="h-[420px] lg:h-[460px] w-full">
                <RouteMap
                  origin={selectedTrip.origin}
                  destination={selectedTrip.destination}
                  vehicleType={selectedTrip.vehicle_type || '53ft Semi Trailer'}
                  status="requested"
                  progress={15}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            Select a freight route to view carrier details and calculate cargo pricing.
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* BOOKING REQUEST MODAL (With Client-Side Overbook Hard-Block)              */}
      {/* ========================================================================= */}
      {isBookModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 overflow-hidden">
            {bookingSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Request Sent to Hauler!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The driver will review your space request. In-app chat unlocks once accepted.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      Request Freight Space
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedTrip.origin} ➔ {selectedTrip.destination}
                    </p>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Available Capacity Reminder */}
                <div className="p-3 rounded-2xl bg-cream-50 border border-cream-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Max Trailer Available:</span>
                    <span className="font-bold text-forest-800">
                      {selectedTrip.available_space} Pallets
                    </span>
                  </div>
                  <CapacityMeter
                    available={selectedTrip.available_space}
                    total={selectedTrip.total_space}
                    compact={true}
                  />
                </div>

                {/* Pallet Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    How many pallets do you need to ship?
                  </label>
                  <input
                    type="number"
                    value={spaceRequested}
                    onChange={(e) => setSpaceRequested(e.target.value)}
                    min="0.5"
                    step="0.5"
                    max={selectedTrip.available_space}
                    required
                    className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold text-slate-900 focus:outline-hidden transition ${
                      parseFloat(spaceRequested) > selectedTrip.available_space
                        ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-200'
                        : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-forest-600'
                    }`}
                  />
                  {parseFloat(spaceRequested) > selectedTrip.available_space && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">
                      ⚠️ Cannot book more than the {selectedTrip.available_space} pallets currently available.
                    </p>
                  )}
                </div>

                {/* Price summary */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Freight Cost</span>
                    <span className="text-[11px] text-slate-400">
                      {spaceRequested || 0} pallets × ${selectedTrip.price_per_unit}
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-forest-800">
                    ${((parseFloat(spaceRequested) || 0) * selectedTrip.price_per_unit).toFixed(2)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    disabled={submittingBooking}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submittingBooking ||
                      parseFloat(spaceRequested) > selectedTrip.available_space ||
                      parseFloat(spaceRequested) <= 0
                    }
                    className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-md transition disabled:opacity-40"
                  >
                    {submittingBooking ? 'Submitting...' : 'Confirm Space Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
