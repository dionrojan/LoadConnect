import React, { useState } from 'react';
import { X, Truck, Calendar, DollarSign, Package, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { tripsAPI } from '../../services/api';

export default function PostTripModal({ isOpen, onClose, onTripCreated }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departure_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    total_space: 14,
    price_per_unit: 120,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const space = parseFloat(formData.total_space);
    const price = parseFloat(formData.price_per_unit);

    if (!formData.origin.trim() || !formData.destination.trim() || !formData.departure_date) {
      setError('Origin, destination, and departure date are required.');
      return;
    }

    if (isNaN(space) || space <= 0) {
      setError('Total space must be greater than 0.');
      return;
    }

    if (isNaN(price) || price < 0) {
      setError('Price per pallet must be a positive number.');
      return;
    }

    setLoading(true);

    try {
      const res = await tripsAPI.createTrip({
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        departure_date: formData.departure_date,
        total_space: space,
        price_per_unit: price,
        notes: formData.notes.trim() || undefined,
      });

      if (onTripCreated) {
        onTripCreated(res.trip);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to post trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">Post a Scheduled Trip</h3>
            <p className="text-xs text-slate-500">Monetize spare trailer capacity on your existing route</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Origin City / State
              </label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                required
                placeholder="e.g. Dallas, TX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-forest-600 focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination City / State
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                placeholder="e.g. Chicago, IL"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-forest-600 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Departure Date & Pallet Space */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departure Date
              </label>
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-forest-600 focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Space
              </label>
              <input
                type="number"
                name="total_space"
                value={formData.total_space}
                onChange={handleChange}
                required
                min="0.5"
                step="0.5"
                placeholder="Pallets"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-forest-600 focus:outline-hidden transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price / Pallet ($)
              </label>
              <input
                type="number"
                name="price_per_unit"
                value={formData.price_per_unit}
                onChange={handleChange}
                required
                min="0"
                step="1"
                placeholder="USD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-forest-600 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cargo & Dock Handling Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Dry goods only, forklift accessible loading dock available, temperature controlled."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 focus:ring-2 focus:ring-forest-600 focus:outline-hidden resize-none transition"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Publish Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
