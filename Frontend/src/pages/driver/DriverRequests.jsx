import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Truck,
  RotateCcw,
  DollarSign,
  Calendar,
  Phone,
  Building,
  AlertCircle
} from 'lucide-react';
import { bookingsAPI, tripsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ChatDrawer from '../../components/common/ChatDrawer';

export default function DriverRequests() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('requested'); // 'requested' | 'accepted' | 'all'
  const [actionId, setActionId] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [notification, setNotification] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await bookingsAPI.getBookings();
      if (res?.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.warn('Failed to load driver bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusUpdate = async (bookingId, nextStatus) => {
    setActionId(bookingId);
    // Optimistic UI update
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );

    try {
      await bookingsAPI.updateStatus(bookingId, nextStatus);
      setNotification(`Booking #${bookingId} was updated to "${nextStatus}".`);
      setTimeout(() => setNotification(''), 4000);
      loadRequests();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
      loadRequests();
    } finally {
      setActionId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div className="flex-1 p-4 lg:p-8 bg-cream-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Inbox className="w-6 h-6 text-forest-700" />
              Incoming Cargo Requests
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Merchants requesting partial space on your published trips
            </p>
          </div>
          <button
            onClick={loadRequests}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {notification && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {[
            { key: 'requested', label: 'Pending Approval', count: bookings.filter((b) => b.status === 'requested').length },
            { key: 'accepted', label: 'Accepted / Reserved', count: bookings.filter((b) => b.status === 'accepted').length },
            { key: 'all', label: 'All Requests', count: bookings.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                filter === tab.key
                  ? 'bg-forest-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* List of Requests */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-white border border-dashed border-slate-200 text-slate-400 text-xs p-8">
            No requests matching "{filter}". New requests from merchants will appear here.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((b) => {
              const isPending = b.status === 'requested';
              const isAccepted = b.status === 'accepted';
              const isPickedUp = b.status === 'picked_up';
              const isDelivered = b.status === 'delivered';

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #BOOKING-{b.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-purple-100 text-purple-800'
                            : isPickedUp
                            ? 'bg-blue-100 text-blue-800'
                            : isAccepted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {b.origin} ➔ {b.destination}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                        {b.merchant_name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {b.merchant_name}
                          {b.business_name && (
                            <span className="text-xs font-medium text-slate-500 ml-1.5">
                              ({b.business_name})
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-extrabold text-forest-700">
                            {b.space_requested} Pallets Requested
                          </span>
                          <span>•</span>
                          <span>Departure: {b.departure_date}</span>
                          <span>•</span>
                          <span>⭐ {b.merchant_rating || 5.0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'declined')}
                          disabled={actionId === b.id}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'accepted')}
                          disabled={actionId === b.id}
                          className="px-5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-md transition"
                        >
                          Accept Request
                        </button>
                      </>
                    ) : (
                      <>
                        {isAccepted && (
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'picked_up')}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Mark Picked Up
                          </button>
                        )}
                        {isPickedUp && (
                          <button
                            onClick={() => handleStatusUpdate(b.id, 'delivered')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Delivered
                          </button>
                        )}
                        <button
                          onClick={() => setChatBooking(b)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                          title="Open In-App Chat"
                        >
                          <MessageSquare className="w-4 h-4 text-forest-700" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {chatBooking && (
        <ChatDrawer
          booking={chatBooking}
          isOpen={!!chatBooking}
          onClose={() => setChatBooking(null)}
        />
      )}
    </div>
  );
}
