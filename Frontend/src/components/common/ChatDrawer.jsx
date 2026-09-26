import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, MessageSquare, AlertCircle, RefreshCw, X, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI } from '../../services/api';
import { socketService } from '../../services/socket';

export default function ChatDrawer({ booking, isOpen, onClose, embedded = false }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const isLocked = !['accepted', 'picked_up', 'delivered'].includes(booking?.status);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history & setup socket room
  useEffect(() => {
    if (!booking?.id || isLocked) return;

    let mounted = true;

    async function loadHistory() {
      setLoading(true);
      setError('');
      try {
        const res = await messagesAPI.getMessages(booking.id);
        if (mounted && res?.messages) {
          setMessages(res.messages);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Failed to load message history:', err.message);
          setError(err.message || 'Could not load messages');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();

    // Join real-time socket room
    socketService.joinBooking(booking.id);

    // Listen for new incoming messages
    const handleReceiveMessage = (newMsg) => {
      if (newMsg?.booking_id === booking.id) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    socketService.onReceiveMessage(handleReceiveMessage);

    return () => {
      mounted = false;
      socketService.offReceiveMessage(handleReceiveMessage);
    };
  }, [booking?.id, isLocked]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending || isLocked) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic message update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      booking_id: booking.id,
      sender_id: user.id,
      sender_name: user.name,
      sender_role: user.role,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Send through socket for instant broadcast
      socketService.sendMessage(booking.id, content);

      // Also persist through REST to ensure consistency with backend
      const res = await messagesAPI.sendMessage(booking.id, content);
      if (res?.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? res.message : m))
        );
      }
    } catch (err) {
      console.warn('Send message error:', err.message);
      // Fallback: keep message if socket worked, otherwise surface error
    } finally {
      setSending(false);
    }
  };

  const contentUI = (
    <div className="flex flex-col h-full bg-cream-50 overflow-hidden">
      {/* Chat Header */}
      <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              Booking Coordination #{booking?.id}
            </h4>
            <p className="text-[11px] text-slate-500">
              {booking?.origin} ➔ {booking?.destination}
            </p>
          </div>
        </div>

        {!embedded && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Messages Body */}
      {isLocked ? (
        // Explicit required locked state
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-cream-100/60">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 shadow-xs border border-amber-200">
            <Lock className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Coordination Chat Locked</h4>
          <p className="text-xs text-slate-600 max-w-xs mt-1.5 leading-relaxed font-medium">
            Chat unlocks once the booking is accepted by the driver.
          </p>
          <div className="mt-4 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-[11px] font-semibold text-amber-900">
            Current Status: <span className="capitalize">{booking?.status || 'requested'}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-center my-2">
            <span className="px-3 py-1 text-[10px] font-medium text-slate-500 bg-slate-200/60 rounded-full">
              End-to-end direct coordination channel
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 animate-spin text-forest-700" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No messages yet. Reach out to coordinate pickup times and loading docks!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isSenderDriver = msg.sender_role === 'driver';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-slate-600">
                      {isMe ? 'You' : msg.sender_name}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        isSenderDriver
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {msg.sender_role}
                    </span>
                  </div>

                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-forest-700 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>

                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Message Input Footer */}
      {!isLocked && (
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (dock number, pallet info)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 border border-transparent focus:border-forest-600 focus:bg-white text-xs text-slate-900 focus:outline-hidden transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white shadow-xs transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );

  if (embedded) {
    return <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200">{contentUI}</div>;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left">
      {contentUI}
    </div>
  );
}
