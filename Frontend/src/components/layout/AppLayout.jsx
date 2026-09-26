import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Truck,
  Package,
  Inbox,
  Search,
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Store,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// List of available drivers with active routes for 1-click switching
const KERALA_DEMO_DRIVERS = [
  { name: 'Sasi Kumar', email: 'driver.sasi@kerala.test', route: 'Kottayam ➔ Kumily', vehicle: 'Tata 407 (14ft)' },
  { name: 'Jomon Joseph', email: 'driver.jomon@kerala.test', route: 'Kochi ➔ Kattappana', vehicle: 'Ashok Leyland Dost' },
  { name: 'Rajesh Pillai', email: 'driver.rajesh@kerala.test', route: 'Kochi ➔ Kollam', vehicle: 'BharatBenz 1617' },
  { name: 'Biju Varghese', email: 'driver.biju@kerala.test', route: 'Kochi ➔ Palakkad', vehicle: 'Tata 1109 Container' },
  { name: 'Shibu Mathew', email: 'driver.shibu@kerala.test', route: 'Kochi ➔ Thiruvananthapuram', vehicle: 'Eicher Pro 3019' },
  { name: 'Dileep Nair', email: 'driver.dileep@kerala.test', route: 'Kochi ➔ Kozhikode', vehicle: 'Mahindra Bolero Maxi' },
  { name: 'Vinod Kurian', email: 'driver.vinod@kerala.test', route: 'Kochi ➔ Munnar', vehicle: 'Tata 709 Reefer' },
  { name: 'Harikrishnan R', email: 'driver.hari@kerala.test', route: 'Kottayam ➔ Thiruvananthapuram', vehicle: 'Eicher Pro 2049' },
  { name: 'Joy Sebastian', email: 'driver.joy@kerala.test', route: 'Kozhikode ➔ Kannur', vehicle: 'Ashok Leyland Partner' },
  { name: 'Anoop Chandran', email: 'driver.anoop@kerala.test', route: 'Palakkad ➔ Coimbatore', vehicle: 'BharatBenz 2823' },
  { name: 'Sudheer Babu', email: 'driver.sudheer@kerala.test', route: 'Kottayam ➔ Kochi', vehicle: 'Tata Ace Gold' },
  { name: 'Suresh Menon', email: 'driver.suresh@kerala.test', route: 'Kanjirappally ➔ Kottayam', vehicle: 'Tata 407 Pickup' },
  { name: 'Dave "Longhaul" Miller', email: 'demo_driver@yoki.test', route: 'Dallas ➔ Chicago', vehicle: '53ft Semi Trailer' },
];

// List of available merchants for 1-click switching
const KERALA_DEMO_MERCHANTS = [
  { name: 'Manoj Thomas', email: 'manoj.spices@kerala.test', business: 'Travancore Spices & Plantations', location: 'Kanjirappally, Kottayam' },
  { name: 'Sujith Varghese', email: 'sujith.coir@kerala.test', business: 'Vembanad Coir & Marine Exporters', location: 'Alappuzha' },
  { name: 'Faisal Rahman', email: 'faisal.hardware@kerala.test', business: 'Malabar Builders & Hardware Trade', location: 'Thrissur' },
  { name: 'Priya Menon', email: 'priya.organics@kerala.test', business: 'Cochin Agro-Export Consortium', location: 'Kochi (Willingdon Island)' },
  { name: 'Anish George', email: 'anish.highrange@kerala.test', business: 'Highrange Cardamom & Cocoa Hub', location: 'Adimali, Idukki' },
  { name: 'Maria Santos', email: 'demo_merchant@yoki.test', business: 'Santos Mexican Food Imports', location: 'Houston, TX' },
];

export default function AppLayout({
  children,
  badgeRequests = 0,
}) {
  const { user, logout, isDriver, isMerchant, switchDemo, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Persistent sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('yoki_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('yoki_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [driverMenuOpen, setDriverMenuOpen] = useState(false);
  const [merchantMenuOpen, setMerchantMenuOpen] = useState(false);
  const driverMenuRef = useRef(null);
  const merchantMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (driverMenuRef.current && !driverMenuRef.current.contains(event.target)) {
        setDriverMenuOpen(false);
      }
      if (merchantMenuRef.current && !merchantMenuRef.current.contains(event.target)) {
        setMerchantMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async () => {
    setIsSwitching(true);
    setDriverMenuOpen(false);
    setMerchantMenuOpen(false);
    try {
      const nextRole = isDriver ? 'merchant' : 'driver';
      await switchDemo(nextRole);
      navigate(nextRole === 'driver' ? '/driver/trips' : '/merchant/search');
    } catch (err) {
      console.error('Demo switch failed:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSelectDriver = async (email) => {
    setIsSwitching(true);
    try {
      await login(email, 'password123');
      navigate('/driver/trips');
      setDriverMenuOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to switch driver:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSelectMerchant = async (email) => {
    setIsSwitching(true);
    try {
      await login(email, 'password123');
      navigate('/merchant/search');
      setMerchantMenuOpen(false);
      setMobileMenuOpen(false);
    } catch (err) {
      console.error('Failed to switch merchant:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  // Nav Items configured per role
  const driverNav = [
    { label: 'My Trips', path: '/driver/trips', icon: Truck },
    { label: 'Incoming Requests', path: '/driver/requests', icon: Inbox, badge: badgeRequests },
    { label: 'Post a Trip', path: '/driver/trips/new', icon: PlusCircle },
    { label: 'Public Profile', path: `/profile/${user?.id || 1}`, icon: User },
  ];

  const merchantNav = [
    { label: 'Find Trips', path: '/merchant/search', icon: Search },
    { label: 'My Bookings', path: '/merchant/bookings', icon: Package, badge: badgeRequests },
    { label: 'Public Profile', path: `/profile/${user?.id || 2}`, icon: User },
  ];

  const navItems = isDriver ? driverNav : merchantNav;

  return (
    // FULL-SCREEN EDGE-TO-EDGE CONTAINER: No gaps, no padding, fills 100% of the viewport
    <div className="h-screen w-screen bg-[#17181A] font-sans antialiased text-slate-800 overflow-hidden flex flex-col lg:flex-row">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#17181A] text-white z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs">
            YK
          </div>
          <span className="font-bold text-sm tracking-tight">YOKI Logistics</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-semibold uppercase">
            {user?.role}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 1 — COLLAPSIBLE DARK SIDEBAR (Near-black #17181A)                   */}
      {/* ========================================================================= */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 bg-[#17181A] text-slate-300 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? 'lg:w-[72px] p-2.5' : 'lg:w-64 p-4'}
          ${mobileMenuOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Header & Brand */}
        <div>
          <div className={`flex items-center pb-4 pt-1 border-b border-white/10 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div
                onClick={isCollapsed ? toggleSidebar : undefined}
                className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-md shrink-0 cursor-pointer"
                title="YOKI Logistics"
              >
                YK
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5 truncate">
                    YOKI <span className="text-[10px] font-normal text-slate-400">Logistics</span>
                  </h1>
                  <p className="text-[10px] text-amber-400/90 font-medium truncate">P2P Freight Hub</p>
                </div>
              )}
            </div>

            {/* Collapse / Expand Toggle Button for Desktop */}
            <button
              onClick={toggleSidebar}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-amber-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation List */}
          <nav className="mt-4 space-y-1.5">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Main Console
              </p>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) => `
                    flex items-center rounded-xl text-xs font-semibold transition-all group relative
                    ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'}
                    ${
                      isActive
                        ? 'bg-forest-700/80 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-slate-200" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {/* Yellow Notification Badge */}
                  {item.badge > 0 && (
                    <span
                      className={`
                        rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-xs shrink-0
                        ${isCollapsed ? 'absolute -top-1 -right-1 w-4 h-4' : 'w-5 h-5'}
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <div className="pt-3 border-t border-white/10">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  System
                </p>
              )}

              {/* 1-Click Role Switcher */}
              <button
                onClick={handleRoleSwitch}
                disabled={isSwitching}
                title={isCollapsed ? `Switch to ${isDriver ? 'Merchant' : 'Driver'}` : undefined}
                className={`
                  w-full flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition group
                  ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2'}
                `}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0 group-hover:rotate-180 transition-transform duration-300" />
                  {!isCollapsed && <span>Switch to {isDriver ? 'Merchant' : 'Driver'}</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono">
                    Demo
                  </span>
                )}
              </button>

              {/* DRIVER MODE ONLY: Switch Between Different Drivers */}
              {isDriver && (
                <div className="relative mt-1" ref={driverMenuRef}>
                  <button
                    onClick={() => setDriverMenuOpen((prev) => !prev)}
                    disabled={isSwitching}
                    title={isCollapsed ? 'Switch Driver (Kerala Fleet)' : undefined}
                    className={`
                      w-full flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition group
                      ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2'}
                      ${driverMenuOpen ? 'bg-white/10 text-white' : ''}
                    `}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <Users className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                      {!isCollapsed && <span className="truncate">Switch Driver</span>}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-semibold font-mono">
                          Fleet
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${driverMenuOpen ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </button>

                  {/* Dropdown Flyout Menu (Positioned ABOVE the button) */}
                  {driverMenuOpen && (
                    <div
                      style={isCollapsed ? { bottom: '0px' } : { bottom: 'calc(100% + 8px)' }}
                      className={`
                        absolute z-50 bg-[#1B1D21] border border-white/15 rounded-2xl p-2 shadow-2xl backdrop-blur-xl w-72
                        ${isCollapsed ? 'left-full ml-2' : 'left-0'}
                      `}
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 mb-1">
                        <span>Select Kerala Driver</span>
                        <span className="text-amber-400 font-mono">13 Drivers</span>
                      </div>

                      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                        {KERALA_DEMO_DRIVERS.map((d) => {
                          const isCurrent = user?.email === d.email;

                          return (
                            <button
                              key={d.email}
                              onClick={() => handleSelectDriver(d.email)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                                isCurrent
                                  ? 'bg-forest-700 text-white font-bold shadow-xs'
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate font-semibold">{d.name}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1 rounded bg-amber-400 text-slate-950 font-bold">Active</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  📍 {d.route}
                                </div>
                                <div className="text-[9px] text-slate-500 truncate">
                                  🚛 {d.vehicle}
                                </div>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MERCHANT MODE ONLY: Switch Between Different Merchants */}
              {isMerchant && (
                <div className="relative mt-1" ref={merchantMenuRef}>
                  <button
                    onClick={() => setMerchantMenuOpen((prev) => !prev)}
                    disabled={isSwitching}
                    title={isCollapsed ? 'Switch Merchant (Kerala Hubs)' : undefined}
                    className={`
                      w-full flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition group
                      ${isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2'}
                      ${merchantMenuOpen ? 'bg-white/10 text-white' : ''}
                    `}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                      <Store className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                      {!isCollapsed && <span className="truncate">Switch Merchant</span>}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-400/20 text-emerald-300 font-semibold font-mono">
                          Hubs
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${merchantMenuOpen ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </button>

                  {/* Dropdown Flyout Menu (Positioned ABOVE the button) */}
                  {merchantMenuOpen && (
                    <div
                      style={isCollapsed ? { bottom: '0px' } : { bottom: 'calc(100% + 8px)' }}
                      className={`
                        absolute z-50 bg-[#1B1D21] border border-white/15 rounded-2xl p-2 shadow-2xl backdrop-blur-xl w-72
                        ${isCollapsed ? 'left-full ml-2' : 'left-0'}
                      `}
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/10 mb-1">
                        <span>Select Kerala Merchant</span>
                        <span className="text-emerald-400 font-mono">6 Merchants</span>
                      </div>

                      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                        {KERALA_DEMO_MERCHANTS.map((m) => {
                          const isCurrent = user?.email === m.email;

                          return (
                            <button
                              key={m.email}
                              onClick={() => handleSelectMerchant(m.email)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition ${
                                isCurrent
                                  ? 'bg-forest-700 text-white font-bold shadow-xs'
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate font-semibold">{m.name}</span>
                                  {isCurrent && (
                                    <span className="text-[9px] px-1 rounded bg-emerald-400 text-slate-950 font-bold">Active</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-amber-300 truncate mt-0.5">
                                  🏢 {m.business}
                                </div>
                                <div className="text-[9px] text-slate-400 truncate">
                                  📍 {m.location}
                                </div>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Pinned User Profile */}
        <div className="pt-3 border-t border-white/10">
          <div className={`flex items-center bg-white/5 rounded-2xl ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'}`}>
            <div className="flex items-center gap-2.5 min-w-0" title={user?.name}>
              <div className="w-8 h-8 rounded-full bg-forest-700 text-amber-300 flex items-center justify-center font-bold text-xs ring-1 ring-white/20 shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {user?.name || 'Logged User'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                      {user?.role}
                    </span>
                    <span className="text-slate-500 text-[10px]">•</span>
                    <span className="text-[10px] text-slate-300 flex items-center gap-0.5">
                      ⭐ {user?.avg_rating || 5.0}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ========================================================================= */}
      {/* COLUMNS 2 & 3 CONTENT WRAPPER: Full height & flex layout                  */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}
