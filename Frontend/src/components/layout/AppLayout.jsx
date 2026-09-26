import React, { useState, useEffect } from 'react';
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
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout({
  children,
  badgeRequests = 0,
}) {
  const { user, logout, isDriver, isMerchant, switchDemo } = useAuth();
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

  const handleRoleSwitch = async () => {
    setIsSwitching(true);
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
