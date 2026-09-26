import React, { useState } from 'react';
import { Star, X, CheckCircle, Loader2 } from 'lucide-react';
import { reviewsAPI } from '../../services/api';

export default function ReviewModal({ isOpen, onClose, booking, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await reviewsAPI.submitReview({
        booking_id: booking.id,
        rating,
        comment: comment.trim() || undefined,
      });

      setSuccess(true);
      if (onReviewSubmitted) {
        onReviewSubmitted(res);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Review Submitted!</h3>
            <p className="text-sm text-slate-500 mt-1">Thank you for strengthening the YOKI trust network.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                ⭐ Delivery Complete
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Rate your freight experience</h2>
              <p className="text-xs text-slate-500 mt-1">
                Booking #{booking.id}: {booking.origin} ➔ {booking.destination}
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                {error}
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="flex flex-col items-center justify-center py-3 bg-cream-100 rounded-2xl border border-cream-200">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-hidden transition-transform transform active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          filled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-2">
                {rating === 5 ? '5 Stars - Exceptional Service' :
                 rating === 4 ? '4 Stars - Great Freight Run' :
                 rating === 3 ? '3 Stars - Average' :
                 rating === 2 ? '2 Stars - Issues Encountered' : '1 Star - Poor Experience'}
              </span>
            </div>

            {/* Review Comment Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Feedback & Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the dock loading, timing, and cargo condition?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:ring-2 focus:ring-forest-600 focus:outline-hidden resize-none transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Verified Review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
