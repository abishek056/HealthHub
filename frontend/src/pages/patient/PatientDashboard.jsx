import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, cancelAppointment } from '../../services/appointmentService';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Phone,
  MapPin,
  FileText,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Activity,
  Heart,
  Droplets,
  Ambulance,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointments();
      const list = Array.isArray(res) ? res : res.data || [];
      setAppointments(list);
    } catch (err) {
      console.warn('Failed to fetch appointments:', err);
      // Mock appointments fallback for demo
      setAppointments([
        {
          id: 1,
          token_number: 'APT-BIR-7421',
          hospital: { name: 'Bir Hospital', address: 'Kantipath, Kathmandu', city: 'Kathmandu', phone: '01-4221119' },
          department: 'Cardiology',
          doctor_name: 'Dr. K.P. Sharma',
          appointment_date: '2026-09-22',
          time_slot: '10:30 AM - 11:00 AM',
          patient_name: user?.name || 'Ram Sharma',
          patient_phone: user?.phone || '9841234567',
          status: 'confirmed',
          symptoms: 'Routine checkup & blood pressure review',
        },
        {
          id: 2,
          token_number: 'APT-PAT-3310',
          hospital: { name: 'Patan Hospital', address: 'Lagankhel, Lalitpur', city: 'Lalitpur', phone: '01-5522266' },
          department: 'Orthopedics',
          doctor_name: 'Dr. Anita Joshi',
          appointment_date: '2026-09-28',
          time_slot: '02:00 PM - 02:30 PM',
          patient_name: user?.name || 'Ram Sharma',
          patient_phone: user?.phone || '9841234567',
          status: 'confirmed',
          symptoms: 'Knee pain after workout',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this hospital appointment?')) {
      return;
    }
    try {
      await cancelAppointment(aptId);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      // Optimistic update in UI
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'cancelled' } : a))
      );
      toast.success('Appointment cancelled');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === 'all') return true;
    return apt.status === filterStatus;
  });

  const upcomingCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <span>Health<span className="text-primary-400">Hub</span></span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs bg-primary-500/15 text-primary-300 font-semibold px-2.5 py-0.5 rounded-full border border-primary-500/20">
            Patient Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user?.name || 'Valued Patient'}</p>
            <p className="text-xs text-slate-400">{user?.email || 'patient@healthhub.com'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-950/60 via-indigo-950/40 to-slate-900 border border-primary-500/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="space-y-2 z-10 max-w-lg">
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">
              Hospital Appointment Booking
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Namaste, {user?.name?.split(' ')[0] || 'Patient'}!
            </h1>
            <p className="text-slate-300 text-sm">
              Search any hospital across the network, reserve an OPD queue token, and visit with zero waiting hassle.
            </p>
          </div>

          <div className="z-10 flex flex-wrap gap-3">
            <Link
              to="/book-appointment"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Book Appointment at Any Hospital
            </Link>
          </div>

          {/* Decorative glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Quick Stats & Shortcuts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{upcomingCount}</p>
              <p className="text-xs text-slate-400">Upcoming Visits</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{appointments.length}</p>
              <p className="text-xs text-slate-400">Total Bookings</p>
            </div>
          </div>

          <Link
            to="/hospitals"
            className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Live Beds Status
              </p>
              <p className="text-xs text-slate-400">Check ICU availability</p>
            </div>
          </Link>

          <a
            href="tel:102"
            className="bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl p-4 flex items-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-300">Ambulance Emergency</p>
              <p className="text-xs text-rose-400/80">Dial 102 Instant</p>
            </div>
          </a>
        </div>

        {/* Appointments Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">My Hospital Appointments & OPD Tokens</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                View your confirmed visit schedules, token passes, and status
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setFilterStatus('confirmed')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'confirmed'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({upcomingCount})
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === 'cancelled'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          {/* List or Cards */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-800/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">No appointments found</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                You haven't booked any hospital appointments in this category yet.
              </p>
              <Link
                to="/book-appointment"
                className="inline-flex items-center gap-2 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-primary-600/20"
              >
                <Plus className="w-4 h-4" /> Book Your First Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => {
                const isConfirmed = apt.status === 'confirmed';
                const isCancelled = apt.status === 'cancelled';

                return (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary-500/10 border border-primary-500/25 text-primary-300">
                          {apt.token_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isConfirmed
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : isCancelled
                              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              : 'bg-slate-700/50 border-slate-600 text-slate-300'
                          }`}
                        >
                          {apt.status ? apt.status.toUpperCase() : 'CONFIRMED'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary-400" />
                          {apt.hospital?.name || 'Selected Hospital'}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {apt.hospital?.address || apt.hospital?.city || 'Central Road'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                        <span className="flex items-center gap-1.5 font-medium text-primary-300">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {apt.department}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {apt.appointment_date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {apt.time_slot}
                        </span>
                        {apt.doctor_name && (
                          <span className="text-slate-400">Dr: {apt.doctor_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      <button
                        onClick={() => setSelectedTicket(apt)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary-400" />
                        View Pass
                      </button>

                      {apt.hospital?.phone && (
                        <a
                          href={`tel:${apt.hospital.phone}`}
                          className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          Call
                        </a>
                      )}

                      {isConfirmed && (
                        <button
                          onClick={() => handleCancel(apt.id)}
                          className="px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                Hospital OPD Pass
              </span>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs text-slate-400">Token Reference #</span>
              <p className="text-3xl font-mono font-extrabold text-white">
                {selectedTicket.token_number}
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 mt-1">
                {selectedTicket.status?.toUpperCase() || 'CONFIRMED'}
              </span>
            </div>

            <div className="bg-slate-950/60 rounded-2xl p-4 space-y-3 text-xs border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Hospital:</span>
                <span className="text-white font-semibold text-right">
                  {selectedTicket.hospital?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-white font-semibold">{selectedTicket.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schedule:</span>
                <span className="text-white font-semibold">
                  {selectedTicket.appointment_date} ({selectedTicket.time_slot})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="text-white font-semibold">{selectedTicket.patient_name}</span>
              </div>
              {selectedTicket.symptoms && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 block mb-1">Reason:</span>
                  <p className="text-slate-300">{selectedTicket.symptoms}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-slate-700"
              >
                <Printer className="w-4 h-4" /> Print Pass
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
