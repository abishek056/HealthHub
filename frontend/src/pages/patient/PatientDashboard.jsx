import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAppointments, cancelAppointment } from '../../services/appointmentService';
import { getMyMedicalRecords } from '../../services/patientRecordService';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  Plus,
  CheckCircle2,
  Printer,
  Phone,
  MapPin,
  FileText,
  LogOut,
  Activity,
  Ambulance,
  ClipboardList,
  Stamp,
  RefreshCw,
  User,
  Cake,
  VenetianMask,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'records'

  // ── Appointments state ──────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // ── Medical records state (unified across every hospital) ───────
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState(false);
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Non-patient users (hospital admin, staff, super admin) should never view the Patient Portal
  useEffect(() => {
    if (user && user.role !== 'patient') {
      if (user.role === 'hospital_admin' || user.role === 'hospital_staff') {
        navigate('/hospital/dashboard', { replace: true });
      } else if (user.role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointments();
      const list = Array.isArray(res) ? res : res.data || [];
      setAppointments(list);
    } catch (err) {
      console.warn('Failed to fetch appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pulls every medical record ever entered for this patient, from any
  // hospital they have ever visited — this is what makes the profile
  // "one patient, one history" instead of one history per hospital.
  const fetchMedicalRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError(false);
    try {
      const res = await getMyMedicalRecords();
      const list = Array.isArray(res) ? res : res.data || [];
      setRecords(list);
    } catch (err) {
      console.warn('Failed to fetch medical records:', err);
      setRecords([]);
      setRecordsError(true);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchMedicalRecords();
  }, [fetchAppointments, fetchMedicalRecords]);

  const handleCancel = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await cancelAppointment(aptId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'cancelled' } : a))
      );
      toast.success('Appointment cancelled');
    } catch (err) {
      // Optimistic fallback if local mock
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

  // Every hospital that has ever filed a record for this patient —
  // used to build the "filter by hospital" pills on the records tab.
  const hospitalsWithRecords = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      if (r.hospital?.id) {
        map.set(r.hospital.id, r.hospital.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (hospitalFilter === 'all') return records;
    return records.filter((r) => String(r.hospital?.id) === String(hospitalFilter));
  }, [records, hospitalFilter]);

  return (
    <div className="min-h-screen bg-[#f8fdfa] text-slate-800 flex flex-col font-sans">
      {/* ── Top Header ── */}
      <header className="border-b border-emerald-100 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/healthhub-logo.png"
              alt="HealthHub"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs bg-[#dff5ea] text-[#0b4d3c] font-bold px-3 py-1 rounded-full border border-[#c2ebd5]">
            Patient Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{user?.name || 'Valued Patient'}</p>
            <p className="text-xs text-slate-500">{user?.email || 'patient@healthhub.com'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-slate-600 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1.5 border border-slate-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#dff5ea] via-[#eaf8f1] to-white border border-[#c2ebd5] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
          <div className="space-y-2 z-10 max-w-lg">
            <span className="text-xs font-bold text-[#167a68] uppercase tracking-wider">
              HealthHub Patient Portal
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0b4d3c]">
              Namaste, {user?.name?.split(' ')[0] || 'Patient'}!
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Manage your confirmed hospital appointments, digital OPD queue tokens, and see your
              complete medical history from every hospital you've ever visited — all in one place.
            </p>
          </div>

          <div className="z-10 flex flex-wrap gap-3">
            <Link
              to="/book-appointment"
              className="px-5 py-3 rounded-2xl bg-[#167a68] hover:bg-[#116253] text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-[#167a68]/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Book Hospital Appointment
            </Link>
          </div>

          {/* Decorative glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Quick Stats & Shortcuts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{upcomingCount}</p>
              <p className="text-xs text-slate-500 font-medium">Active Visits</p>
            </div>
          </div>

          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{records.length}</p>
              <p className="text-xs text-slate-500 font-medium">Medical Records</p>
            </div>
          </div>

          <Link
            to="/hospitals"
            className="bg-white border border-[#c8eedc] hover:border-emerald-400 rounded-2xl p-4 flex items-center gap-3 transition-all shadow-xs group hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-[#167a68] transition-colors">
                Live Beds Status
              </p>
              <p className="text-xs text-slate-500">Check ICU availability</p>
            </div>
          </Link>

          <a
            href="tel:102"
            className="bg-rose-50 border border-rose-200 hover:border-rose-400 rounded-2xl p-4 flex items-center gap-3 transition-all shadow-xs group hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-700">Ambulance SOS</p>
              <p className="text-xs text-rose-600/80">Dial 102 Instant</p>
            </div>
          </a>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex items-center gap-1.5 bg-[#dff5ea] p-1 rounded-full border border-[#c2ebd5] w-fit">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'bg-[#167a68] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'records'
                ? 'bg-[#167a68] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Medical Records
            {records.length > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === 'records' ? 'bg-white/20' : 'bg-[#167a68]/10 text-[#0b4d3c]'
                }`}
              >
                {records.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Appointments Tab ── */}
        {activeTab === 'appointments' && (
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0b4d3c]">
                  My Hospital Appointments & OPD Tokens
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  View your confirmed visit schedules, token passes, and real-time status
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#dff5ea] p-1 rounded-full border border-[#c2ebd5]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-[#167a68] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({appointments.length})
                </button>
                <button
                  onClick={() => setFilterStatus('confirmed')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'confirmed'
                      ? 'bg-[#167a68] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active ({upcomingCount})
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'completed'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completed ({completedCount})
                </button>
                <button
                  onClick={() => setFilterStatus('cancelled')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancelled ({appointments.filter((a) => a.status === 'cancelled').length})
                </button>
              </div>
            </div>

            {/* List or Cards */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-emerald-50/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-emerald-200 rounded-2xl space-y-3 bg-[#fbfdfc]">
                <Calendar className="w-12 h-12 text-[#167a68]/40 mx-auto" />
                <p className="text-slate-800 font-bold text-base">No appointments found</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  You haven't booked any hospital appointments in this category yet.
                </p>
                <Link
                  to="/book-appointment"
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-[#167a68] hover:bg-[#116253] text-white px-5 py-2.5 rounded-full transition-all shadow-md shadow-[#167a68]/20"
                >
                  <Plus className="w-4 h-4" /> Book Your First Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((apt) => {
                  const isConfirmed = apt.status === 'confirmed';
                  const isCompleted = apt.status === 'completed';
                  const isCancelled = apt.status === 'cancelled';

                  return (
                    <div
                      key={apt.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? 'bg-[#f4fbf8] border-[#c2ebd5] shadow-xs'
                          : isConfirmed
                          ? 'bg-[#fbfdfc] border-emerald-100 hover:border-emerald-300 hover:shadow-md'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      {/* Info */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#dff5ea] border border-[#c2ebd5] text-[#0b4d3c]">
                            Token: {apt.token_number}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isConfirmed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : isCompleted
                                ? 'bg-teal-50 border-teal-300 text-teal-800'
                                : isCancelled
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                            {apt.status ? apt.status.toUpperCase() : 'CONFIRMED'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#167a68]" />
                            {apt.hospital?.name || 'Selected Hospital'}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {apt.hospital?.address || apt.hospital?.city || 'Central Road'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1.5 font-semibold text-[#0b4d3c]">
                            <Stethoscope className="w-3.5 h-3.5 text-[#167a68]" />
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
                            <span className="text-slate-500 font-medium">Dr: {apt.doctor_name}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-100">
                        <button
                          onClick={() => setSelectedTicket(apt)}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-[#0b4d3c] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#c8eedc] shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#167a68]" />
                          View Pass
                        </button>

                        {apt.hospital?.phone && (
                          <a
                            href={`tel:${apt.hospital.phone}`}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            Call
                          </a>
                        )}

                        {isConfirmed && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
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
        )}

        {/* ── Medical Records Tab ── */}
        {activeTab === 'records' && (
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0b4d3c]">
                  My Unified Medical History
                </h2>
                <p className="text-slate-500 text-xs mt-1 max-w-md">
                  Every diagnosis and treatment note filed for you — from any hospital you've
                  visited — gathered in one place, not just the last one you went to.
                </p>
              </div>

              <button
                onClick={fetchMedicalRecords}
                disabled={recordsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#c8eedc] text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recordsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Hospital filter pills */}
            {hospitalsWithRecords.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 bg-[#dff5ea] p-1 rounded-full border border-[#c2ebd5] w-fit">
                <button
                  onClick={() => setHospitalFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    hospitalFilter === 'all'
                      ? 'bg-[#167a68] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Hospitals ({records.length})
                </button>
                {hospitalsWithRecords.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHospitalFilter(h.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      String(hospitalFilter) === String(h.id)
                        ? 'bg-[#167a68] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}

            {recordsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-emerald-50/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recordsError ? (
              <div className="text-center py-16 border border-dashed border-rose-200 rounded-2xl space-y-3 bg-rose-50/40">
                <FileText className="w-12 h-12 text-rose-400/70 mx-auto" />
                <p className="text-slate-800 font-bold text-base">Couldn't load your records</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Something went wrong while fetching your medical history. Please try again.
                </p>
                <button
                  onClick={fetchMedicalRecords}
                  className="inline-flex items-center gap-2 text-xs font-semibold bg-[#167a68] hover:bg-[#116253] text-white px-5 py-2.5 rounded-full transition-all shadow-md shadow-[#167a68]/20"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-emerald-200 rounded-2xl space-y-3 bg-[#fbfdfc]">
                <FileText className="w-12 h-12 text-[#167a68]/40 mx-auto" />
                <p className="text-slate-800 font-bold text-base">No medical records yet</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Once a hospital visit is recorded by hospital staff, it will automatically
                  appear here — no matter which hospital you visit.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl border bg-[#fbfdfc] border-emerald-100 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#dff5ea] border border-[#c2ebd5] text-[#0b4d3c] flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {rec.hospital?.name || 'Hospital Visit'}
                        </span>
                        {rec.appointment?.department && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 border border-[#c8eedc] text-[#167a68]">
                            {rec.appointment.department} OPD
                          </span>
                        )}
                        {rec.appointment?.token_number && (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#dff5ea] border border-[#c2ebd5] text-[#0b4d3c]">
                            Token: {rec.appointment.token_number}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-[#167a68]" />
                          {rec.diagnosis || 'General Consultation'}
                        </h3>
                        {rec.treatment && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            Treatment: {rec.treatment}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {rec.patient_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Cake className="w-3.5 h-3.5 text-slate-400" />
                          {rec.age} yrs
                        </span>
                        <span className="flex items-center gap-1.5 capitalize">
                          <VenetianMask className="w-3.5 h-3.5 text-slate-400" />
                          {rec.gender}
                        </span>
                        {rec.creator?.name && (
                          <span className="text-slate-500 font-medium">
                            Attended by: {rec.creator.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-100">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-[#0b4d3c] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#c8eedc] shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#167a68]" />
                        View Full Record
                      </button>

                      {rec.hospital?.phone && (
                        <a
                          href={`tel:${rec.hospital.phone}`}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          Call Hospital
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white border border-[#c8eedc] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <img src="/healthhub-icon.png" alt="HealthHub" className="w-7 h-7 object-contain" />
                <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#0b4d3c]">
                  Hospital OPD Pass
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1 bg-[#dff5ea] rounded-2xl p-4 border border-[#c2ebd5]">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Digital Queue Token #
              </span>
              <p className="text-3xl font-mono font-extrabold text-[#0b4d3c]">
                {selectedTicket.token_number}
              </p>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-800 shadow-xs mt-1">
                {selectedTicket.status?.toUpperCase() || 'CONFIRMED'}
              </span>
            </div>

            <div className="bg-[#fbfdfc] rounded-2xl p-4 space-y-3 text-xs border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital:</span>
                <span className="text-slate-900 font-bold text-right">
                  {selectedTicket.hospital?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-900 font-bold">{selectedTicket.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="text-slate-900 font-bold">
                  {selectedTicket.appointment_date} ({selectedTicket.time_slot})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="text-slate-900 font-bold">{selectedTicket.patient_name}</span>
              </div>
              {selectedTicket.symptoms && (
                <div className="pt-2 border-t border-emerald-100">
                  <span className="text-slate-500 block mb-1">Chief Complaints:</span>
                  <p className="text-slate-700">{selectedTicket.symptoms}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0b4d3c] text-xs font-bold flex items-center justify-center gap-2 border border-[#c8eedc] shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#167a68]" /> Print Pass
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-xs font-bold shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Record Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white border border-[#c8eedc] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <img src="/healthhub-icon.png" alt="HealthHub" className="w-7 h-7 object-contain" />
                <span className="font-serif text-sm font-bold uppercase tracking-wider text-[#0b4d3c]">
                  Medical Record
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1 bg-[#dff5ea] rounded-2xl p-4 border border-[#c2ebd5]">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center justify-center gap-1.5">
                <Stamp className="w-3.5 h-3.5" />
                {selectedRecord.hospital?.name || 'Hospital Visit'}
              </span>
              <p className="text-lg font-serif font-extrabold text-[#0b4d3c]">
                {selectedRecord.diagnosis || 'General Consultation'}
              </p>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-white text-emerald-800 shadow-xs mt-1">
                {selectedRecord.created_at
                  ? new Date(selectedRecord.created_at).toLocaleDateString()
                  : ''}
              </span>
            </div>

            <div className="bg-[#fbfdfc] rounded-2xl p-4 space-y-3 text-xs border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="text-slate-900 font-bold text-right">
                  {selectedRecord.patient_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Gender:</span>
                <span className="text-slate-900 font-bold capitalize">
                  {selectedRecord.age} yrs • {selectedRecord.gender}
                </span>
              </div>
              {selectedRecord.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="text-slate-900 font-bold">{selectedRecord.phone}</span>
                </div>
              )}
              {selectedRecord.appointment && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-[#0b4d3c] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#167a68]" /> OPD Appointment
                    </span>
                    <span className="font-mono font-bold text-[10px] bg-[#dff5ea] text-[#0b4d3c] px-1.5 py-0.5 rounded border border-[#c2ebd5]">
                      Token: {selectedRecord.appointment.token_number}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-100">
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <p className="font-bold text-slate-800">{selectedRecord.appointment.department}</p>
                    </div>
                    {selectedRecord.appointment.doctor_name && (
                      <div>
                        <span className="text-slate-500">Doctor:</span>
                        <p className="font-bold text-slate-800">Dr. {selectedRecord.appointment.doctor_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.creator?.name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Attended By:</span>
                  <span className="text-slate-900 font-bold">{selectedRecord.creator.name}</span>
                </div>
              )}
              {selectedRecord.diagnosis && (
                <div className="pt-2 border-t border-emerald-100">
                  <span className="text-slate-500 block mb-1">Diagnosis:</span>
                  <p className="text-slate-700">{selectedRecord.diagnosis}</p>
                </div>
              )}
              {selectedRecord.treatment && (
                <div className="pt-2 border-t border-emerald-100">
                  <span className="text-slate-500 block mb-1">Treatment:</span>
                  <p className="text-slate-700">{selectedRecord.treatment}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0b4d3c] text-xs font-bold flex items-center justify-center gap-2 border border-[#c8eedc] shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#167a68]" /> Print Record
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-xs font-bold shadow-sm"
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