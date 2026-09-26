import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  MessageSquare,
  Star,
  MapPin,
  Calendar,
  AlertCircle,
  Phone,
  XCircle,
  Search,
  ExternalLink
} from 'lucide-react';
import { bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusStepper from '../../components/common/StatusStepper';
import RouteMap from '../../components/common/RouteMap';
import ChatDrawer from '../../components/common/ChatDrawer';
import ReviewModal from '../../components/common/ReviewModal';

export default function MerchantBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending' | 'in_transit' | 'delivered' | 'declined'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.getBookings();
      if (res?.bookings) {
        setBookings(res.bookings);
        if (res.bookings.length > 0 && !selectedBooking) {
          setSelectedBooking(res.bookings[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load merchant bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Cancel / Withdraw a Pending Request
  const handleWithdrawRequest = async (bookingId) => {
    if (!window.confirm('Are you sure you want to withdraw this cargo space request?')) return;
    setActionLoading(true);
    try {
      await bookingsAPI.updateStatus(bookingId, 'declined');
      setFeedback('Booking request withdrawn.');
      setTimeout(() => setFeedback(''), 3000);
      loadBookings();
    } catch (err) {
      alert(`Withdrawal failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return b.status === 'requested';
    if (filterTab === 'in_transit') return b.status === 'accepted' || b.status === 'picked_up';
    if (filterTab === 'delivered') return b.status === 'delivered';
    if (filterTab === 'declined') return b.status === 'declined';
    return true;
  });

  return (
    <>
      {/* COLUMN 2 — MY CARGO BOOKINGS LIST PANEL */}
      {/* ========================================================================= */}
      <section className="w-full lg:w-[360px] xl:w-[390px] shrink-0 border-r border-slate-200/90 flex flex-col justify-between bg-cream-100 overflow-hidden">
        {/* Header & Filter Tabs */}
        <div className="p-4 border-b border-slate-200/80 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-forest-700" />
              <span>My Cargo Bookings</span>
            </h2>
            <button
              onClick={loadBookings}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Filter Pills matching Reference 2 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { key: 'all', label: 'All', count: bookings.length },
              { key: 'pending', label: 'Pending', count: bookings.filter((b) => b.status === 'requested').length },
              { key: 'in_transit', label: 'In Transit', count: bookings.filter((b) => b.status === 'accepted' || b.status === 'picked_up').length },
              { key: 'delivered', label: 'Delivered', count: bookings.filter((b) => b.status === 'delivered').length },
            ].map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
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

        {/* Scrollable Bookings List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading your cargo runs...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No cargo bookings in "{filterTab}". Find an active route to book pallets.
            </div>
          ) : (
            filteredBookings.map((b) => {
              const isSelected = selectedBooking?.id === b.id;
              const isDelivered = b.status === 'delivered';
              const isPickedUp = b.status === 'picked_up';
              const isAccepted = b.status === 'accepted';
              const isPending = b.status === 'requested';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'bg-white border-forest-600 shadow-md ring-1 ring-forest-600'
                      : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Card Header: ID + Status Pill */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      #BOOKING-{b.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : isPickedUp
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : isAccepted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* Route with Start/End Dots (Reference 2 style) */}
                  <div className="space-y-1 my-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-forest-700" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {b.origin}
                      </span>
                    </div>
                    <div className="ml-1 w-0.5 h-3 bg-slate-200 border-l border-dashed border-slate-300" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {b.destination}
                      </span>
                    </div>
                  </div>

                  {/* Driver Name & Pallet Count */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[9px]">
                        {b.driver_name?.charAt(0) || 'D'}
                      </div>
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                        {b.driver_name}
                      </span>
                    </div>

                    <span className="font-extrabold text-forest-700">
                      {b.space_requested} Pallets
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COLUMN 3 — BOOKING TRACKING & STATUS DETAILS (~65% width)                 */}
      {/* ========================================================================= */}
      <section className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
        {selectedBooking ? (
          <div className="p-4 lg:p-6 space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  No: #BOOKING-{selectedBooking.id}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selectedBooking.origin} ➔ {selectedBooking.destination}
                </h3>
              </div>

              {/* Action Buttons: Cancel or Chat */}
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'requested' && (
                  <button
                    onClick={() => handleWithdrawRequest(selectedBooking.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                  >
                    Withdraw Request
                  </button>
                )}

                {selectedBooking.status === 'delivered' && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-xs transition"
                  >
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    Review Hauler
                  </button>
                )}

                <button
                  onClick={() => setChatOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Driver Chat
                </button>
              </div>
            </div>

            {feedback && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Stepper & Driver Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stepper Timeline (Reference 2 style) */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-700 mb-3">Freight Journey Stepper</h4>
                <StatusStepper currentStatus={selectedBooking.status} />
              </div>

              {/* Driver & Trip Details */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-700">Driver & Rig Details</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-700 text-amber-300 flex items-center justify-center font-bold text-base">
                    {selectedBooking.driver_name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedBooking.driver_name}</h4>
                    <p className="text-xs text-slate-500">{selectedBooking.vehicle_type || '53ft Semi Trailer'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-amber-800">
                        ⭐ {selectedBooking.driver_rating || 5.0} Rating
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cargo Booked</span>
                    <span className="font-extrabold text-forest-800">
                      {selectedBooking.space_requested} Pallets
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Rate</span>
                    <span className="font-extrabold text-slate-900">
                      ${((selectedBooking.space_requested || 0) * (selectedBooking.price_per_unit || 100)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedBooking.driver_phone && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Driver Direct Phone: <strong className="text-slate-800">{selectedBooking.driver_phone}</strong></span>
                  </div>
                )}

                {(selectedBooking.pickup_location || selectedBooking.business_address || user?.business_address) && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-amber-900">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pickup Location: <strong className="text-slate-800">{selectedBooking.pickup_location || selectedBooking.business_address || user?.business_address}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Live GPS Telemetry Map */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700">Live Cargo Tracking</h4>
                <span className="text-[10px] text-slate-400">GPS Updated</span>
              </div>
              <div className="h-[420px] lg:h-[460px] w-full">
                <RouteMap
                  origin={selectedBooking.origin}
                  destination={selectedBooking.destination}
                  vehicleType={selectedBooking.vehicle_type || '53ft Semi Trailer'}
                  status={selectedBooking.status}
                  progress={
                    selectedBooking.status === 'delivered'
                      ? 100
                      : selectedBooking.status === 'picked_up'
                      ? 65
                      : selectedBooking.status === 'accepted'
                      ? 25
                      : 5
                  }
                  merchants={[{
                    name: selectedBooking.merchant_name || user?.name || 'Your Location',
                    business_name: selectedBooking.business_name || user?.business_name || 'My Cargo Hub',
                    address: selectedBooking.pickup_location || selectedBooking.business_address || selectedBooking.pickup_address || user?.business_address,
                    space_requested: selectedBooking.space_requested,
                    status: selectedBooking.status
                  }]}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-sm">
            Select a cargo booking to view transit status and live tracking.
          </div>
        )}
      </section>

      {/* Real-time In-App Chat Drawer */}
      {selectedBooking && (
        <ChatDrawer
          booking={selectedBooking}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Post-Delivery Review Modal */}
      {selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onReviewSubmitted={() => {
            loadBookings();
          }}
        />
      )}
    </>
  );
}
