import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BedDouble,
  Truck,
  Users,
  FileText,
  LogOut,
  Hospital,
  Menu,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function HospitalAdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/hospital/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hospital/beds', label: 'Manage Beds', icon: BedDouble },
    { to: '/hospital/ambulances', label: 'Track Ambulances', icon: Truck },
    { to: '/hospital/opd', label: 'Manage OPD Queue', icon: Users },
    { to: '/hospital/patients', label: 'Patient Records', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Hospital className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">HealthHub Staff</h1>
            <p className="text-[11px] text-slate-400">Hospital #{user?.hospital_id || 1}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
            <Hospital className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wide text-white block">HealthHub</span>
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              Staff Portal
            </span>
          </div>
        </div>

        {/* Hospital Context Card */}
        <div className="mx-4 my-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Hospital Admin'}</p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.role === 'hospital_admin' ? 'Hospital Admin' : 'Hospital Staff'} • #{user?.hospital_id || 1}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <NavLink
              to="/"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Portal</span>
            </NavLink>
          </div>
        </nav>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar header */}
        <header className="px-6 py-5 border-b border-slate-800/60 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tenant Scoped: Hospital #{user?.hospital_id || 1}</span>
          </div>
        </header>

        {/* Page Inner Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
