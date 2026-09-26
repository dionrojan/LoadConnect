import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone
} from 'lucide-react';
import { tripsAPI, bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CapacityMeter from '../../components/common/CapacityMeter';
import StatusStepper from '../../components/common/StatusStepper';
import RouteMap from '../../components/common/RouteMap';
import ChatDrawer from '../../components/common/ChatDrawer';
import ReviewModal from '../../components/common/ReviewModal';

export default function DriverDashboard({ onOpenPostModal }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'completed'
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'tracking' | 'chat'
  const [chatBooking, setChatBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Fetch driver's trips
  const loadTrips = async () => {
    try {
      setLoading(true);
      const res = await tripsAPI.getTrips({ driver_id: user?.id, status: '' });
      if (res?.trips) {
        setTrips(res.trips);
        if (res.trips.length > 0 && !selectedTrip) {
          // Load full details for first trip
          loadTripDetail(res.trips[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTripDetail = async (tripId) => {
    try {
      const res = await tripsAPI.getTripById(tripId);
      if (res?.trip) {
        setSelectedTrip(res.trip);
      }
    } catch (err) {
      console.error('Failed to load trip details:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadTrips();
    }
  }, [user?.id]);

  // Handle Accept Booking (Optimistic Update)
  const handleAcceptBooking = async (bookingId, spaceRequested) => {
    setActionLoading(true);
    // Optimistic UI capacity decrement
    if (selectedTrip) {
      const updatedBookings = (selectedTrip.bookings || []).map((b) =>
        b.id === bookingId ? { ...b, status: 'accepted' } : b
      );
      setSelectedTrip({
        ...selectedTrip,
        available_space: Math.max(0, selectedTrip.available_space - spaceRequested),
        bookings: updatedBookings,
      });
    }

    try {
      await bookingsAPI.updateStatus(bookingId, 'accepted');
      setFeedbackMsg(`Booking #${bookingId} accepted! Space reserved.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
      loadTripDetail(selectedTrip.id);
      loadTrips();
    } catch (err) {
      alert(`Accept failed: ${err.message}`);
      loadTripDetail(selectedTrip.id);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Decline Booking
  const handleDeclineBooking = async (bookingId) => {
    setActionLoading(true);
    try {
      await bookingsAPI.updateStatus(bookingId, 'declined');
      setFeedbackMsg(`Booking #${bookingId} declined.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadTripDetail(selectedTrip.id);
    } catch (err) {
      alert(`Decline failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Transit Action Button (Mark Picked Up / Mark Delivered)
  const handleUpdateBookingTransit = async (bookingId, nextStatus) => {
    setActionLoading(true);
    try {
      const res = await bookingsAPI.updateStatus(bookingId, nextStatus);
      setFeedbackMsg(`Booking #${bookingId} status updated to: ${nextStatus.replace('_', ' ')}!`);
      setTimeout(() => setFeedbackMsg(''), 4000);

      if (nextStatus === 'delivered') {
        const found = selectedTrip?.bookings?.find((b) => b.id === bookingId);
        if (found) {
          setReviewBooking(found);
        }
      }
      loadTripDetail(selectedTrip.id);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter trips
  const filteredTrips = trips.filter((t) => {
    const matchSearch =
      t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.id).includes(searchTerm);
    if (!matchSearch) return false;
    if (filterTab === 'all') return true;
    return t.status === filterTab;
  });

  return (
    <>
      {/* COLUMN 2 — LIST PANEL (Warm cream #FAF8F4) */}
      {/* ========================================================================= */}
      <section className="w-full lg:w-[360px] xl:w-[390px] shrink-0 border-r border-slate-200/90 flex flex-col justify-between bg-cream-100 overflow-hidden">
        {/* Top Header: Title, Search & Filter Tabs */}
        <div className="p-4 border-b border-slate-200/80 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>My Active Trips</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {trips.length}
              </span>
            </h2>
            <button
              onClick={loadTrips}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search origin, destination, ID..."
              className="w-full pl-9 pr-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:bg-white transition"
            />
          </div>

          {/* Segmented Filter Pill Tabs matching Reference 2 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: 'all', label: 'All Trips', count: trips.length },
              { key: 'active', label: 'Active', count: trips.filter((t) => t.status === 'active').length },
              { key: 'completed', label: 'Completed', count: trips.filter((t) => t.status === 'completed').length },
            ].map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-forest-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable List of Item Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading trips...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No trips found. Click below to post your first route.
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const isSelected = selectedTrip?.id === trip.id;
              const hasAvailable = trip.available_space > 0;

              return (
                <div
                  key={trip.id}
                  onClick={() => loadTripDetail(trip.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'bg-white border-forest-600 shadow-md ring-1 ring-forest-600'
                      : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Card Header: ID + Status Pill */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      #TRIP-{trip.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        trip.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  {/* Route with Start/End dots & connecting line (Reference 2 style) */}
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

                  {/* Departure & Price Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {trip.departure_date}
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      ${trip.price_per_unit} <span className="text-[10px] font-normal text-slate-500">/ pallet</span>
                    </span>
                  </div>

                  {/* Capacity Bar */}
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

        {/* Pinned Bottom Button: "+ Post a Trip" matching Reference 2 */}
        <div className="p-3 border-t border-slate-200/90 bg-white">
          <button
            onClick={onOpenPostModal}
            className="w-full py-3 px-4 rounded-2xl bg-[#17181A] hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition transform active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            + Post a New Trip
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 3 — DETAIL + MAP PANEL (~65% width)                               */}
      {/* ========================================================================= */}
      <section className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
        {selectedTrip ? (
          <div className="p-4 lg:p-6 space-y-5">
            {/* Top Bar: Reference ID & Quick Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  No: #TRIP-{selectedTrip.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedTrip.origin} ➔ {selectedTrip.destination}
                </h3>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => alert(`Share link copied: ${window.location.href}`)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title="Copy ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-tabs: Load Info / Tracking / Chat */}
            <div className="flex items-center gap-2">
              {['details', 'tracking'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab === 'details' ? 'Trip Details & Cargo' : 'Live Tracking Map'}
                </button>
              ))}
            </div>

            {/* Notification Feedback Toast */}
            {feedbackMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* Grid: Details & Capacity on Left, Stepper on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trip Specs Card */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Freight Specifications</span>
                  <span className="text-xs font-extrabold text-forest-700">
                    ${selectedTrip.price_per_unit} / pallet
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Departure Date</span>
                    <span className="font-bold text-slate-800">{selectedTrip.departure_date}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Vehicle Assigned</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {selectedTrip.vehicle_type || '53ft Semi Trailer'}
                    </span>
                  </div>
                </div>

                <CapacityMeter
                  available={selectedTrip.available_space}
                  total={selectedTrip.total_space}
                />

                {selectedTrip.notes && (
                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60">
                    "{selectedTrip.notes}"
                  </p>
                )}
              </div>

              {/* Status Timeline / Stepper matching Reference 2 */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-3">Freight Transit Stages</h4>
                  <StatusStepper
                    currentStatus={
                      selectedTrip.status === 'completed'
                        ? 'delivered'
                        : selectedTrip.bookings?.some((b) => b.status === 'picked_up')
                        ? 'picked_up'
                        : selectedTrip.bookings?.some((b) => b.status === 'accepted')
                        ? 'accepted'
                        : 'requested'
                    }
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* INCOMING BOOKING REQUESTS ON THIS TRIP                                    */}
            {/* ========================================================================= */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Merchant Cargo Requests</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-forest-100 text-forest-800">
                    {selectedTrip.bookings?.length || 0}
                  </span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Accepting immediately deducts available space
                </span>
              </div>

              {(!selectedTrip.bookings || selectedTrip.bookings.length === 0) ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs">
                  No merchant booking requests yet for this trip.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTrip.bookings.map((booking) => {
                    const isAccepted = booking.status === 'accepted';
                    const isPickedUp = booking.status === 'picked_up';
                    const isDelivered = booking.status === 'delivered';
                    const isRequested = booking.status === 'requested';

                    return (
                      <div
                        key={booking.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        {/* Merchant Details */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                            {booking.merchant_name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {booking.merchant_name}
                              </span>
                              {booking.business_name && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ({booking.business_name})
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                ⭐ {booking.merchant_rating || 5.0}
                              </span>
                            </div>

                            <p className="text-xs font-extrabold text-forest-800 mt-0.5">
                              {booking.space_requested} pallets requested •{' '}
                              <span className="text-slate-600 font-normal">
                                Total: ${(booking.space_requested * selectedTrip.price_per_unit).toFixed(2)}
                              </span>
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isDelivered
                                    ? 'bg-purple-100 text-purple-800'
                                    : isPickedUp
                                    ? 'bg-blue-100 text-blue-800'
                                    : isAccepted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {booking.status}
                              </span>
                              {booking.merchant_phone && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  {booking.merchant_phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Accept / Decline / Transit Updates / Chat */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {isRequested && (
                            <>
                              <button
                                onClick={() => handleDeclineBooking(booking.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleAcceptBooking(booking.id, booking.space_requested)}
                                disabled={actionLoading}
                                className="px-4 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition"
                              >
                                Accept & Reserve
                              </button>
                            </>
                          )}

                          {/* Transit Stepper Buttons (Mark Picked Up / Mark Delivered) */}
                          {isAccepted && (
                            <button
                              onClick={() => handleUpdateBookingTransit(booking.id, 'picked_up')}
                              disabled={actionLoading}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              Mark Picked Up
                            </button>
                          )}

                          {isPickedUp && (
                            <button
                              onClick={() => handleUpdateBookingTransit(booking.id, 'delivered')}
                              disabled={actionLoading}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Delivered
                            </button>
                          )}

                          {/* Chat Trigger (Unlocks on Accepted, Picked Up, Delivered) */}
                          <button
                            onClick={() => setChatBooking(booking)}
                            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition relative"
                            title="Open In-App Chat"
                          >
                            <MessageSquare className="w-4 h-4 text-forest-700" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* LIVE ROUTE MAP (Reference 2 Bottom Strip)                                */}
            {/* ========================================================================= */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700">Live GPS Route & Highway Telemetry</h4>
                <span className="text-[10px] text-slate-400">I-35 Freight Corridor</span>
              </div>
              <div className="h-[420px] lg:h-[460px] w-full">
                <RouteMap
                  origin={selectedTrip.origin}
                  destination={selectedTrip.destination}
                  vehicleType={selectedTrip.vehicle_type || '53ft Semi Trailer'}
                  status={selectedTrip.bookings?.some((b) => b.status === 'picked_up') ? 'picked_up' : 'requested'}
                  progress={selectedTrip.status === 'completed' ? 100 : 55}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            Select a trip from the list to view telemetry and cargo bookings.
          </div>
        )}
      </section>

      {/* Real-time In-App Chat Drawer */}
      {chatBooking && (
        <ChatDrawer
          booking={chatBooking}
          isOpen={!!chatBooking}
          onClose={() => setChatBooking(null)}
        />
      )}

      {/* Review Modal on Delivered */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewSubmitted={() => {
            loadTripDetail(selectedTrip.id);
          }}
        />
      )}
    </>
  );
}
