import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Truck,
  Building2,
  Sparkles,
  Maximize2,
  Navigation,
  MapPin,
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState('driver'); // 'driver' | 'merchant'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle_type: '53ft Dry Van Trailer',
    max_capacity: 26,
    business_name: '',
    business_address: '',
  });

  const { login, signup, switchDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        const destination = location.state?.from?.pathname || (user.role === 'driver' ? '/driver/trips' : '/merchant/search');
        navigate(destination, { replace: true });
      } else {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          role,
          vehicle_type: role === 'driver' ? formData.vehicle_type : undefined,
          max_capacity: role === 'driver' ? parseFloat(formData.max_capacity) : undefined,
          business_name: role === 'merchant' ? formData.business_name.trim() : undefined,
          business_address: role === 'merchant' ? formData.business_address.trim() : undefined,
        };
        const user = await signup(payload);
        const destination = user.role === 'driver' ? '/driver/trips' : '/merchant/search';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helper (Reference 1 Sparkle icon triggers this)
  const handleQuickDemoFill = (targetRole = role) => {
    if (targetRole === 'driver') {
      setRole('driver');
      setFormData({
        name: 'Dave "Longhaul" Miller',
        email: 'demo_driver@yoki.test',
        password: 'password123',
        phone: '+1 555-0199',
        vehicle_type: '53ft Semi Trailer',
        max_capacity: 26,
        business_name: '',
        business_address: '',
      });
    } else {
      setRole('merchant');
      setFormData({
        name: 'Maria Santos Produce',
        email: 'demo_merchant@yoki.test',
        password: 'password123',
        phone: '+1 555-0288',
        vehicle_type: '',
        max_capacity: '',
        business_name: 'Santos Mexican Food Imports',
        business_address: '450 Broad St, Houston TX',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#EFECE6] p-3 sm:p-6 lg:p-10 flex items-center justify-center font-sans antialiased">
      {/* Outer Floating Split-Panel Card matching Reference 1 (24px radius, subtle shadow) */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl lg:rounded-4xl shadow-2xl border border-black/5 overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
        
        {/* ========================================================================= */}
        {/* LEFT PANEL (~40% width, cream background #FAF8F4, form controls)          */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[44%] p-6 sm:p-10 flex flex-col justify-between bg-[#FAF8F4]">
          <div>
            {/* Logo / Wordmark top-left */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-forest-700 font-mono">
                  yoki
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-full">
                Freight MVP
              </span>
            </div>

            {/* Large Two-Line Bold Headline */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isLogin ? (
                <>Welcome back to <br />your haul</>
              ) : (
                <>Start your <br />perfect haul</>
              )}
            </h1>

            {/* Social-Auth Row matching Reference 1 (Apple, Google, Meta pill) */}
            <div className="mt-5 flex items-center justify-center">
              <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white shadow-xs border border-slate-200/70">
                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('driver')}
                  title="Demo Driver Fill"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-75 transition"
                >
                  <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-5.74-8.8-10.15-18.91-13.24-30.34-3.08-11.43-4.63-22.34-4.63-32.74 0-14.65 3.65-26.68 10.95-36.1 7.3-9.42 16.51-14.28 27.63-14.59 4.35 0 9.29 1.14 14.82 3.42 5.53 2.28 9.27 3.48 11.22 3.6 2.45-.33 6.47-1.63 12.06-3.9 5.59-2.27 10.51-3.3 14.76-3.08 12.51.76 22.56 5.48 30.15 14.16-10.99 6.64-16.38 15.79-16.17 27.46.22 9.03 3.69 16.65 10.42 22.87 6.73 6.22 14.73 9.77 24.01 10.64-2.28 7.08-5.27 14.23-8.96 21.46zM119.22 31.85c0-7.39 2.66-14.31 7.98-20.76 5.32-6.45 11.98-10.44 19.98-11.97.22 1.3.33 2.5.33 3.59 0 7.39-2.83 14.53-8.49 21.42-5.66 6.89-12.56 10.82-20.7 11.78-.33-1.41-.5-2.76-.5-4.06z" />
                  </svg>
                </button>
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('merchant')}
                  title="Demo Merchant Fill"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-75 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </button>
                {/* Meta */}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  title="Toggle Login / Signup"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-75 transition text-blue-600 font-bold text-xs"
                >
                  f
                </button>
              </div>
            </div>

            {/* "or" divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-3 bg-[#FAF8F4] text-xs text-slate-400 font-medium">
                or
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Role Toggle Pill Buttons (Signup only, matching Reference 1 placement) */}
            {!isLogin && (
              <div className="mb-4 p-1 bg-slate-200/70 rounded-full flex items-center">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    role === 'driver'
                      ? 'bg-forest-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  I am a Driver
                </button>
                <button
                  type="button"
                  onClick={() => setRole('merchant')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    role === 'merchant'
                      ? 'bg-forest-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  I am a Merchant
                </button>
              </div>
            )}

            {/* Stacked Input Form matching Reference 1 rounded styling */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:border-transparent transition shadow-xs"
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:border-transparent transition shadow-xs"
                />
              </div>

              {/* Password with Eye show/hide icon */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-11 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 focus:border-transparent transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Dynamic Role Fields on Signup */}
              {!isLogin && role === 'driver' && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                  <div>
                    <select
                      name="vehicle_type"
                      value={formData.vehicle_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-forest-600 shadow-xs"
                    >
                      <option value="53ft Dry Van Trailer">53ft Dry Van</option>
                      <option value="Reefer (Cold Chain)">Reefer (Cold)</option>
                      <option value="Flatbed Trailer">Flatbed</option>
                      <option value="Box Truck 26ft">Box Truck 26ft</option>
                      <option value="Cargo Sprinter Van">Cargo Van</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      name="max_capacity"
                      value={formData.max_capacity}
                      onChange={handleChange}
                      placeholder="Capacity (pallets)"
                      className="w-full px-3 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {!isLogin && role === 'merchant' && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="Business Name (e.g. Santos Organic Foods)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 shadow-xs"
                  />
                  <input
                    type="text"
                    name="business_address"
                    value={formData.business_address}
                    onChange={handleChange}
                    placeholder="Pickup/Warehouse Address"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-forest-600 shadow-xs"
                  />
                </div>
              )}

              {/* Solid Dark-Green Primary Button matching Reference 1 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Start'}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom link matching Reference 1 ("Already have an account? Log in") */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs text-slate-600 hover:text-forest-700 font-medium transition"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-bold text-slate-900 underline">Sign up</span></>
              ) : (
                <>Already have an account? <span className="font-bold text-slate-900 underline">Log in</span></>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL (~60% width, full-bleed photo with floating pill chips)        */}
        {/* ========================================================================= */}
        <div className="relative w-full lg:w-[56%] bg-slate-900 overflow-hidden min-h-[360px] lg:min-h-auto">
          {/* High-res scenic highway & mountain freight corridor photo */}
          <img
            src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=1600&auto=format&fit=crop"
            alt="YOKI Freight Corridor"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08]"
          />

          {/* Subtle gradient vignette to blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* SVG Route Line connecting chips across the mountain road (Reference 1 style) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 700">
            <path
              d="M 160 520 Q 320 400 410 260 T 260 140"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="3.5"
              strokeDasharray="6 8"
              opacity="0.9"
            />
          </svg>

          {/* Chip 1 (Top pin): Place name + short label */}
          <div
            className="absolute flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/65 backdrop-blur-md text-white shadow-2xl border border-white/15"
            style={{ left: '16%', top: '18%' }}
          >
            <div className="w-8 h-8 rounded-full bg-forest-700/80 flex items-center justify-center text-amber-300">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold tracking-tight">Dallas Logistics Hub</p>
              <p className="text-[10px] text-slate-300">Central Dock #4 • Verified</p>
            </div>
          </div>

          {/* Chip 2 (Middle route): Distance/ETA pill ("12 km to pickup") */}
          <div
            className="absolute flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/65 backdrop-blur-md text-white shadow-2xl border border-white/15"
            style={{ right: '14%', top: '38%' }}
          >
            <div className="w-8 h-8 rounded-full bg-amber-400/90 text-slate-950 flex items-center justify-center font-bold">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold tracking-tight">12 km to pickup</p>
              <p className="text-[10px] text-slate-300">4 pallets available on trailer</p>
            </div>
          </div>

          {/* Chip 3 (Bottom marker): Route Corridor label ("Gringo Trail" equivalent) */}
          <div
            className="absolute px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-xs font-extrabold shadow-2xl border border-black/10"
            style={{ left: '28%', bottom: '26%' }}
          >
            I-35 Freight Corridor
          </div>

          {/* Floating Action Buttons bottom-right (Reference 1 style: expand & sparkle AI demo button) */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2.5 z-20">
            <button
              type="button"
              onClick={() => handleQuickDemoFill(role === 'driver' ? 'merchant' : 'driver')}
              title="1-Click Fill Demo Credentials"
              className="w-11 h-11 rounded-full bg-black/75 hover:bg-black text-amber-300 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform active:scale-95 group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              title="Toggle Login / Signup"
              className="w-11 h-11 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform active:scale-95"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
