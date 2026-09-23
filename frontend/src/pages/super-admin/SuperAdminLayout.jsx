import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  LogOut,
  Shield,
  Activity,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard',  color: 'text-emerald-700' },
  { to: '/admin/hospitals',  icon: Building2,        label: 'Hospitals',  color: 'text-teal-700' },
  { to: '/admin/users',      icon: Users,            label: 'Users',      color: 'text-emerald-700' },
  { to: '/admin/analytics',  icon: BarChart3,        label: 'Analytics',  color: 'text-[#167a68]' },
];

export default function SuperAdminLayout({ children }) {
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
    : 'SA';

  const activeNav = NAV.find((n) => location.pathname.startsWith(n.to));

  return (
    <div className="min-h-screen bg-[#f8fdfa] text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">

            {/* Logo */}
            <NavLink to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0 mr-3">
              <img
                src="/healthhub-icon.png"
                alt="HealthHub"
                className="w-8 h-8 object-contain"
              />
              <div className="hidden sm:block">
                <span className="font-bold text-sm tracking-wide text-[#0b4d3c]">HealthHub</span>
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-[#dff5ea] border border-[#c2ebd5] px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
            </NavLink>

            {/* Desktop tab nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
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

            {/* Right area */}
            <div className="flex items-center gap-2.5 ml-auto">
              {/* System status */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-[#0b4d3c] bg-[#dff5ea] border border-[#c2ebd5] px-3 py-1 rounded-full">
                <Activity className="w-3 h-3 text-emerald-700" />
                <span className="text-[#0b4d3c]">Network Operational</span>
              </div>

              {/* Public portal */}
              <NavLink
                to="/"
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0b4d3c] bg-white hover:bg-emerald-50 border border-[#c8eedc] px-3 py-1.5 rounded-full transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#167a68]" />
                Public
              </NavLink>

              {/* User menu */}
              <div className="relative">
                <button
                  id="admin-user-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-white hover:bg-emerald-50/60 border border-[#c8eedc] rounded-full px-2.5 py-1.5 transition-colors shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-[#167a68] flex items-center justify-center text-white text-[10px] font-bold">
                    {initials}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-800">
                    {user?.name?.split(' ')[0] || 'Admin'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#c8eedc] rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-emerald-100 bg-[#fbfdfc]">
                        <p className="text-xs font-bold text-slate-900">{user?.name || 'Super Admin'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <span className="mt-1.5 inline-block text-[10px] font-bold text-[#167a68] bg-[#dff5ea] px-2 py-0.5 rounded-full border border-[#c2ebd5]">
                          Super Administrator
                        </span>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <NavLink
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 rounded-xl transition-colors font-medium"
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
                id="admin-mobile-menu-toggle"
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-emerald-100 py-3 grid grid-cols-4 gap-1.5">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
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

      {/* ── Secondary title bar ── */}
      <div className="bg-[#f0faf5] border-b border-emerald-100/80 px-4 sm:px-6 py-3.5 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              National Health Network
            </span>
            <h1 className="font-serif text-lg sm:text-xl font-bold text-[#0b4d3c] tracking-tight">
              {activeNav?.label || 'Super Admin Center'}
            </h1>
          </div>
          {activeNav && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b4d3c] bg-white border border-[#c8eedc] px-3 py-1 rounded-full shadow-xs">
              <activeNav.icon className="w-3.5 h-3.5 text-[#167a68]" />
              {activeNav.label}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
