import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Ambulance,
  Clock,
  FileText,
  Users,
  LogOut,
  Hospital,
  Building2,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useActiveHospital } from '../../hooks/useActiveHospital';

const NAV_LINKS = [
  { to: '/hospital/dashboard',         label: 'Dashboard',       icon: LayoutDashboard, color: 'text-emerald-700' },
  { to: '/hospital/appointments',      label: 'Appointments',    icon: CalendarCheck,   color: 'text-teal-700' },
  { to: '/hospital/beds',              label: 'Beds',            icon: BedDouble,       color: 'text-emerald-700' },
  { to: '/hospital/ambulances',        label: 'Ambulances',      icon: Ambulance,       color: 'text-rose-600' },
  { to: '/hospital/opd',              label: 'OPD Queue',        icon: Clock,           color: 'text-emerald-700' },
  { to: '/hospital/patients',          label: 'Patients',        icon: FileText,        color: 'text-teal-700' },
  { to: '/hospital/register-patient', label: 'Register Patient', icon: UserPlus,        color: 'text-blue-600' },
  { to: '/hospital/staff',             label: 'Staff',           icon: Users,           color: 'text-emerald-700', adminOnly: true },
];

export default function HospitalAdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hospitalId, hospitals, changeHospital, currentHospital } = useActiveHospital();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isHospitalAdmin = user?.role === 'hospital_admin';

  const navLinks = NAV_LINKS.filter((l) => !l.adminOnly || isHospitalAdmin || isSuperAdmin);

  const getNavHref = (to) => {
    return isSuperAdmin && hospitalId ? `${to}?hospitalId=${hospitalId}` : to;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'HA';

  const activeLink = navLinks.find((l) => location.pathname.startsWith(l.to));

  return (
    <div className="min-h-screen bg-[#f8fdfa] text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <NavLink
              to="/hospital/dashboard"
              className="flex items-center gap-2.5 shrink-0 mr-3"
            >
              <img
                src="/healthhub-icon.png"
                alt="HealthHub"
                className="w-8 h-8 object-contain"
              />
              <div className="hidden sm:block">
                <span className="font-bold text-sm tracking-wide text-[#0b4d3c]">HealthHub</span>
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-[#dff5ea] border border-[#c2ebd5] px-2 py-0.5 rounded-full">
                  Hospital Desk
                </span>
              </div>
            </NavLink>

            {/* Desktop Tab Nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={getNavHref(to)}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#167a68] text-white shadow-sm'
                        : 'text-slate-600 hover:text-[#0b4d3c] hover:bg-emerald-50'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2.5 ml-auto">
              {/* Hospital Switcher or Badge */}
              {isSuperAdmin ? (
                <div className="flex items-center gap-1.5 bg-[#dff5ea] border border-[#c2ebd5] rounded-xl px-2.5 py-1 text-xs shadow-xs">
                  <Building2 className="w-3.5 h-3.5 text-[#167a68] shrink-0" />
                  <select
                    id="super-admin-hospital-select"
                    value={hospitalId}
                    onChange={(e) => changeHospital(e.target.value)}
                    className="bg-transparent text-[#0b4d3c] text-xs font-bold focus:outline-none cursor-pointer pr-1"
                    title="Switch Hospital View"
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id} className="bg-white text-slate-800">
                        {h.name} (#{h.id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-[#0b4d3c] bg-[#dff5ea] border border-[#c2ebd5] px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>{currentHospital?.name || `Hospital #${hospitalId}`}</span>
                </div>
              )}

              {/* Public portal link */}
              <NavLink
                to="/"
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b4d3c] bg-white hover:bg-emerald-50 border border-[#c8eedc] px-3 py-1.5 rounded-full transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#167a68]" />
                Public
              </NavLink>

              {/* User dropdown */}
              <div className="relative">
                <button
                  id="hospital-user-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-white hover:bg-emerald-50/60 border border-[#c8eedc] rounded-full px-2.5 py-1.5 transition-colors shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#167a68] flex items-center justify-center text-white text-[10px] font-bold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name?.split(' ')[0] || 'Admin'}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">
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
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#c8eedc] rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-emerald-100 bg-[#fbfdfc]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#167a68] flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{user?.name || 'Hospital Admin'}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#167a68]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{user?.role === 'hospital_admin' ? 'Hospital Administrator' : 'Hospital Staff'}</span>
                        </div>
                      </div>

                      <div className="p-2 space-y-0.5">
                        <NavLink
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:text-[#0b4d3c] hover:bg-emerald-50 rounded-xl transition-colors font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#167a68]" />
                          Public Portal
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold"
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
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-emerald-100 py-3 grid grid-cols-3 gap-1.5">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={getNavHref(to)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-[#167a68] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-emerald-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Secondary breadcrumb / page title bar */}
      {(title || subtitle) && (
        <div className="bg-[#f0faf5] border-b border-emerald-100/80 px-4 sm:px-6 py-3.5 max-w-screen-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#0b4d3c] tracking-tight">{title}</h1>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{subtitle}</p>
              )}
            </div>
            {activeLink && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b4d3c] bg-white border border-[#c8eedc] px-3 py-1 rounded-full shadow-xs">
                <activeLink.icon className="w-3.5 h-3.5 text-[#167a68]" />
                {activeLink.label}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
