import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  MapPin,
  Calendar,
  ArrowUpRight,
  Search,
  Activity,
  Ambulance,
  Clock,
  Droplets,
  ShieldCheck,
  Phone,
  Mail,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Hospital,
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hospitals?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/hospitals');
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#f8fdfa] flex flex-col font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100/70 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/healthhub-logo.png"
                alt="HealthHub"
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#top"
                className="text-slate-700 hover:text-emerald-700 font-medium text-sm transition-colors"
              >
                Home
              </a>
              <a
                href="#about"
                className="text-slate-700 hover:text-emerald-700 font-medium text-sm transition-colors"
              >
                About Us
              </a>
              <a
                href="#services"
                className="text-slate-700 hover:text-emerald-700 font-medium text-sm transition-colors"
              >
                Services
              </a>
              <a
                href="#contact"
                className="text-slate-700 hover:text-emerald-700 font-medium text-sm transition-colors"
              >
                Contact Us
              </a>

              {isAuthenticated ? (
                <Link
                  to={
                    user?.role === 'super_admin'
                      ? '/admin/dashboard'
                      : user?.role === 'hospital_admin' || user?.role === 'hospital_staff'
                        ? '/hospital/dashboard'
                        : '/user/dashboard'
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-emerald-700 text-white hover:bg-emerald-800 transition-all shadow-sm shadow-emerald-700/20"
                >
                  <User className="w-4 h-4 text-emerald-200" />
                  <span>{user?.name?.split(' ')[0] || 'My Portal'}</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-5 py-1.5 rounded-full border-2 border-[#167a68] text-[#167a68] hover:bg-[#167a68]/10 text-sm font-semibold transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/login"
                    state={{ mode: 'register' }}
                    className="inline-flex items-center justify-center px-5 py-1.5 rounded-full bg-[#238b55] hover:bg-[#1c7446] text-white text-sm font-semibold shadow-sm shadow-[#238b55]/30 transition-all hover:shadow-md"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Auth Button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-full bg-[#238b55] text-white text-xs font-semibold"
              >
                {isAuthenticated ? 'Portal' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden bg-slate-900 min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center">
          {/* Hospital Building Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero-hospital.webp"
              alt="HealthHub Connected Hospital Building"
              className="w-full h-full object-cover object-center lg:object-right filter brightness-95"
              loading="eager"
              fetchpriority="high"
            />
            {/* Directional Overlay to keep text readable on left while letting building shine on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent lg:w-3/4" />
            <div className="absolute inset-0 bg-slate-950/20" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 w-full">
            <div className="max-w-2xl">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-emerald-300 text-xs sm:text-sm font-bold tracking-widest uppercase">
                  WELCOME TO HEALTH HUB
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-md">
                Care That Connects. <br />
                Health That Matters.
              </h1>

              {/* Subtitle */}
              <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-emerald-50/90 font-normal leading-relaxed max-w-xl drop-shadow-sm">
                Connecting you to trusted doctors and personalized care, all in one place.
              </p>

              {/* Search Bar */}
              <div className="mt-8 sm:mt-10 max-w-lg">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-2xl border border-white/60 focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
                >
                  <div className="flex-1 flex items-center pl-4">
                    <Search className="w-5 h-5 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hospitals by name, city, or specialty..."
                      className="w-full pl-3 pr-2 py-2.5 bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#167a68] hover:bg-[#116253] text-white text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Search
                  </button>
                </form>

                {/* Sub-search badges */}
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-100/80">
                  <span className="font-semibold text-white">Popular:</span>
                  <Link to="/hospitals?search=Bir" className="hover:text-white underline underline-offset-2">Bir Hospital</Link>
                  <span>•</span>
                  <Link to="/hospitals?search=Emergency" className="hover:text-white underline underline-offset-2">ICU & Emergency</Link>
                  <span>•</span>
                  <Link to="/book-appointment" className="hover:text-white underline underline-offset-2">OPD Booking</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Floating Quick Navigation Cards (Overlapping Hero & Mint Section) ── */}
        <section className="relative z-20 -mt-10 sm:-mt-14 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Doctors */}
            <Link
              to="/hospitals"
              className="group bg-[#dff5ea] hover:bg-[#d5f0e2] border border-[#c2ebd5] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#c3ebd7] flex items-center justify-center text-[#106948] group-hover:bg-[#b2e5cc] transition-colors">
                  <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-serif font-bold text-lg sm:text-xl text-[#0b4d3c] tracking-tight">
                  Doctors
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#106948] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </Link>

            {/* Card 2: Location */}
            <Link
              to="/hospitals"
              className="group bg-[#dff5ea] hover:bg-[#d5f0e2] border border-[#c2ebd5] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#c3ebd7] flex items-center justify-center text-[#106948] group-hover:bg-[#b2e5cc] transition-colors">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-serif font-bold text-lg sm:text-xl text-[#0b4d3c] tracking-tight">
                  Location
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#106948] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </Link>

            {/* Card 3: Appointments */}
            <Link
              to="/book-appointment"
              className="group bg-[#dff5ea] hover:bg-[#d5f0e2] border border-[#c2ebd5] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#c3ebd7] flex items-center justify-center text-[#106948] group-hover:bg-[#b2e5cc] transition-colors">
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="font-serif font-bold text-lg sm:text-xl text-[#0b4d3c] tracking-tight">
                  Appointments
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#106948] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── About HealthHub Section ── */}
        <section id="about" className="pt-16 pb-20 sm:py-24 bg-[#eaf8f1] mt-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column Text */}
              <div className="lg:col-span-7">
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b4d3c] tracking-tight uppercase">
                  ABOUT HEALTHHUB
                </h2>

                <div className="mt-6 space-y-4 text-slate-700 text-base sm:text-lg leading-relaxed">
                  <p>
                    HealthHub makes healthcare simple, accessible, and connected.
                  </p>
                  <p>
                    We bring trusted doctors, medical services, and appointments together in one place.
                  </p>
                  <p>
                    Our goal is to provide better care and a better healthcare experience for everyone.
                  </p>
                </div>

                {/* Core Pillars */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-white/70 backdrop-blur rounded-2xl p-3.5 border border-emerald-200/60 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#167a68] shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#0b4d3c]">
                      Real-Time Bed & ICU Availability
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/70 backdrop-blur rounded-2xl p-3.5 border border-emerald-200/60 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#167a68] shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#0b4d3c]">
                      GPS-Enabled Ambulance Dispatch
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/70 backdrop-blur rounded-2xl p-3.5 border border-emerald-200/60 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#167a68] shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#0b4d3c]">
                      Digital OPD Tokens & Live Queues
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/70 backdrop-blur rounded-2xl p-3.5 border border-emerald-200/60 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#167a68] shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-[#0b4d3c]">
                      Kathmandu Blood Bank Network
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/book-appointment"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#167a68] hover:bg-[#116253] text-white text-sm font-semibold shadow-md transition-all hover:scale-105"
                  >
                    Book an Appointment <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/hospitals"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-emerald-50 text-[#167a68] border-2 border-[#167a68] text-sm font-semibold transition-all"
                  >
                    Explore Network Hospitals
                  </Link>
                </div>
              </div>

              {/* Right Column Image */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-300 to-teal-200 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500" />
                  <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                    <img
                      src="/about-team.png"
                      alt="HealthHub Dedicated Medical Team"
                      className="w-full h-auto object-cover max-h-[380px] sm:max-h-[420px] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-4 text-white text-center">
                      <p className="text-xs sm:text-sm font-bold tracking-wide">
                        Dedicated Healthcare Professionals Ready 24/7
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Services Section ("other service and other section too working") ── */}
        <section id="services" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-[#167a68] bg-[#dff5ea] px-3.5 py-1.5 rounded-full">
                Connected Hospital Services
              </span>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Everything You Need for Fast, Reliable Care
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600">
                HealthHub integrates emergency dispatch, live ward capacities, and digital queue tokens in real-time.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1: Live Bed Tracker */}
              <div className="bg-[#f7fcf9] rounded-2xl p-6 border border-emerald-100/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-[#167a68] mb-5 group-hover:bg-[#167a68] group-hover:text-white transition-colors">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Live Bed Tracker
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Check real-time availability of ICU, Ventilator, Emergency, and General beds across all network hospitals.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#167a68]">Live Updates</span>
                  <Link
                    to="/hospitals"
                    className="text-xs font-semibold text-slate-700 hover:text-[#167a68] flex items-center gap-1"
                  >
                    View Beds <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 2: GPS Ambulance */}
              <div className="bg-[#f7fcf9] rounded-2xl p-6 border border-emerald-100/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-5 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Ambulance className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    GPS Ambulance
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Request an emergency ambulance and monitor its live location on the map as it approaches your point of care.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600">Dial 102 / SOS</span>
                  <button
                    onClick={() => {
                      const btn = document.querySelector('button[aria-label*="Emergency"]');
                      if (btn) btn.click();
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-rose-600 flex items-center gap-1"
                  >
                    SOS Dispatch <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feature 3: Digital OPD Token */}
              <div className="bg-[#f7fcf9] rounded-2xl p-6 border border-emerald-100/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 mb-5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Digital OPD Queue
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Reserve digital tokens and view real-time OPD waiting queues by department to avoid long waiting lines.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700">Digital Queue</span>
                  <Link
                    to="/book-appointment"
                    className="text-xs font-semibold text-slate-700 hover:text-teal-700 flex items-center gap-1"
                  >
                    Get Token <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 4: Blood Donor Bank */}
              <div className="bg-[#f7fcf9] rounded-2xl p-6 border border-emerald-100/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-5 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Blood Bank Stock
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Check immediate blood bank inventory across major hospitals in Kathmandu for all primary blood groups.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600">All Blood Types</span>
                  <Link
                    to="/hospitals"
                    className="text-xs font-semibold text-slate-700 hover:text-red-600 flex items-center gap-1"
                  >
                    Check Stock <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Contact Section ── */}
        <section id="contact" className="py-16 bg-[#f0fbf5] border-t border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#c8eedc] shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  24/7 Emergency & Inquiries
                </span>
                <h3 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                  Need Immediate Healthcare Assistance?
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Our emergency coordination team and patient support are available around the clock to assist you with hospital routing, ambulance calls, and specialist appointments.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="bg-[#dff5ea] rounded-2xl p-4 border border-[#c2ebd5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase text-emerald-800">Helpline / Ambulance</div>
                    <div className="text-base font-extrabold text-slate-900">+977 9800000000 / 102</div>
                  </div>
                </div>

                <div className="bg-[#dff5ea] rounded-2xl p-4 border border-[#c2ebd5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#167a68] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase text-emerald-800">Email Inquiries</div>
                    <div className="text-base font-extrabold text-slate-900">healthhub@gmail.com</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Soft Mint Footer (Exact Replication of Reference) ── */}
      <footer className="bg-[#daf2e6] border-t border-[#c6edd8] text-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Logo & Tagline */}
            <div className="lg:col-span-2">
              <Link to="/" className="inline-block">
                <img
                  src="/healthhub-logo.png"
                  alt="HealthHub"
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <p className="mt-3 font-serif font-semibold text-sm text-[#0b4d3c]">
                Care That connects. <br />
                Health That matters.
              </p>
              <p className="mt-3 text-xs text-slate-600 max-w-sm leading-relaxed">
                HealthHub coordinates real-time emergency healthcare data, hospital bed allocation, ambulance telemetry, and outpatient appointments.
              </p>
            </div>

            {/* Explore Column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b4d3c] mb-4">
                Explore
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><a href="#top" className="hover:text-emerald-800 transition-colors">Home</a></li>
                <li><Link to="/hospitals" className="hover:text-emerald-800 transition-colors">Departments</Link></li>
                <li><a href="#services" className="hover:text-emerald-800 transition-colors">Services</a></li>
                <li><a href="#about" className="hover:text-emerald-800 transition-colors">About Us</a></li>
              </ul>
            </div>

            {/* Patient Care Column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b4d3c] mb-4">
                Patient Care
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li><Link to="/hospitals" className="hover:text-emerald-800 transition-colors">Find a doctor</Link></li>
                <li><Link to="/book-appointment" className="hover:text-emerald-800 transition-colors">Book Appointment</Link></li>
                <li><Link to="/user/dashboard" className="hover:text-emerald-800 transition-colors">Patient Support</Link></li>
                <li><a href="#services" className="hover:text-emerald-800 transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b4d3c] mb-4">
                Contact
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Kathmandu, NEPAL</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>+977 9800000000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>healthhub@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-[#c6edd8] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} HealthHub. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-xs text-slate-600">
              <a href="#" className="hover:text-emerald-900 transition-colors">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-emerald-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
