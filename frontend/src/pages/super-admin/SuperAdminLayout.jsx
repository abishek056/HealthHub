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
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard',  color: 'text-sky-400' },
  { to: '/admin/hospitals',  icon: Building2,        label: 'Hospitals',  color: 'text-violet-400' },
  { to: '/admin/users',      icon: Users,            label: 'Users',      color: 'text-blue-400' },
  { to: '/admin/analytics',  icon: BarChart3,        label: 'Analytics',  color: 'text-amber-400' },
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden">

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl shadow-slate-950/60">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-4">

            {/* Logo */}
            <NavLink to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0 mr-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-sm tracking-wide text-white">HealthHub</span>
                <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/50 px-1.5 py-0.5 rounded">
                  Super Admin
                </span>
              </div>
            </NavLink>

            {/* Desktop tab nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-purple-600 text-white shadow shadow-purple-950'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right area */}
            <div className="flex items-center gap-2 ml-auto">
              {/* System status */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700 px-2.5 py-1 rounded-lg">
                <Activity className="w-3 h-3 text-purple-400" />
                <span className="text-emerald-400">Operational</span>
              </div>

              {/* Public portal */}
              <NavLink
                to="/"
                className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-700/50 border border-slate-700/50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Public
              </NavLink>

              {/* User menu */}
              <div className="relative">
                <button
                  id="super-admin-user-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-xl px-2.5 py-1.5 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-tight">{user?.name?.split(' ')[0] || 'Super Admin'}</p>
                    <p className="text-[10px] text-purple-400 leading-tight">Super Admin</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-slate-950 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black">
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{user?.name || 'Super Admin'}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-[10px] font-bold text-purple-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> System Administrator
                        </p>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <NavLink
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Public Portal
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                id="super-admin-mobile-menu-toggle"
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800 py-2 pb-3 grid grid-cols-4 gap-1">
              {NAV.map(({ to, icon: Icon, label, color }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
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

      {/* Page subtitle strip */}
      {activeNav && (
        <div className="bg-slate-900/40 border-b border-slate-800/50 px-4 sm:px-6 py-2.5 max-w-screen-2xl mx-auto w-full">
          <div className={`flex items-center gap-1.5 text-xs font-bold ${activeNav.color}`}>
            <activeNav.icon className="w-3.5 h-3.5" />
            {activeNav.label}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
