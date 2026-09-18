import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BedDouble,
  Truck,
  Users,
  FileText,
  LogOut,
  Hospital,
  UserPlus,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const navLinks = [
  { to: '/hospital/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, color: 'text-sky-400' },
  { to: '/hospital/appointments', label: 'Appointments', icon: Calendar,        color: 'text-cyan-400' },
  { to: '/hospital/beds',         label: 'Beds',         icon: BedDouble,      color: 'text-blue-400' },
  { to: '/hospital/ambulances',   label: 'Ambulances',   icon: Truck,          color: 'text-emerald-400' },
  { to: '/hospital/opd',          label: 'OPD Queue',    icon: Users,          color: 'text-purple-400' },
  { to: '/hospital/patients',     label: 'Patients',     icon: FileText,       color: 'text-amber-400' },
  { to: '/hospital/staff',        label: 'Staff',        icon: UserPlus,       color: 'text-rose-400' },
];

export default function HospitalAdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HA';

  const activeLink = navLinks.find((l) => location.pathname.startsWith(l.to));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl shadow-slate-950/60">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-4">

            {/* Logo */}
            <NavLink
              to="/hospital/dashboard"
              className="flex items-center gap-2.5 shrink-0 mr-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950">
                <Hospital className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-sm tracking-wide text-white">HealthHub</span>
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                  Staff
                </span>
              </div>
            </NavLink>

            {/* Desktop Tab Nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow shadow-emerald-950'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Live badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700 px-2.5 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Hospital #{user?.hospital_id || 1}</span>
              </div>

              {/* Public portal link */}
              <NavLink
                to="/"
                className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Public
              </NavLink>

              {/* User dropdown */}
              <div className="relative">
                <button
                  id="hospital-user-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-xl px-2.5 py-1.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-black">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-tight">{user?.name?.split(' ')[0] || 'Admin'}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {user?.role === 'hospital_admin' ? 'Admin' : 'Staff'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-slate-950 z-50 overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-black">
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{user?.name || 'Hospital Admin'}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{user?.role === 'hospital_admin' ? 'Hospital Administrator' : 'Hospital Staff'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-2 space-y-0.5">
                        <NavLink
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Public Portal
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                id="hospital-mobile-menu-toggle"
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile Nav Dropdown ── */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800 py-2 pb-3 grid grid-cols-3 gap-1">
              {navLinks.map(({ to, label, icon: Icon, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Secondary breadcrumb / page title bar ── */}
      {(title || subtitle) && (
        <div className="bg-slate-900/40 border-b border-slate-800/50 px-4 sm:px-6 py-3 max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">{title}</h1>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{subtitle}</p>
              )}
            </div>
            {activeLink && (
              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${activeLink.color} bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg`}>
                <activeLink.icon className="w-3 h-3" />
                {activeLink.label}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
