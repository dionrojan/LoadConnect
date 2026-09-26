import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  User,
  Truck,
  Building2,
  Calendar,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Award,
  ArrowLeft
} from 'lucide-react';
import { reviewsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetId = userId || currentUser?.id;

  const loadProfile = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await reviewsAPI.getUserReviews(targetId);
      if (res) {
        setProfileUser(res.user);
        setReviews(res.reviews || []);
      }
    } catch (err) {
      console.warn('Failed to load profile reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [targetId]);

  return (
    <div className="flex-1 p-4 lg:p-8 bg-cream-100 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading profile and verified ratings...</div>
        ) : profileUser ? (
          <>
            {/* Profile Overview Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-forest-700 text-amber-300 flex items-center justify-center font-extrabold text-2xl shadow-md">
                  {profileUser.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {profileUser.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-100 text-forest-800">
                      {profileUser.role}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5">
                    {profileUser.role === 'driver'
                      ? profileUser.vehicle_type || 'Commercial Freight Hauler'
                      : profileUser.business_name || 'Verified Merchant'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                    <span className="flex items-center gap-1 text-amber-900 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {profileUser.avg_rating || 5.0} / 5.0
                    </span>
                    <span>•</span>
                    <span>{profileUser.total_reviews || reviews.length} verified reviews</span>
                    <span>•</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ID & Background Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Reviews Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-forest-700" />
                  Verified Delivery Reviews ({reviews.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Reviews are strictly submitted post-delivery
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-white border border-dashed border-slate-200 text-slate-400 text-xs">
                  No reviews submitted yet for this user. Reviews unlock once a booking reaches "delivered".
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {r.reviewer_name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">
                            {r.reviewer_role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      {r.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed italic bg-cream-50 p-2.5 rounded-xl border border-cream-200">
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">User profile not found.</div>
        )}
      </div>
    </div>
  );
}
