import React, { useState, useEffect, useCallback, useMemo } from 'react';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getHospitalAppointments,
  updateAppointmentStatus,
} from '../../services/adminService';
import { bookAppointment } from '../../services/appointmentService';
import useWebSocket from '../../hooks/useWebSocket';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Stethoscope,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Printer,
  X,
  FileText,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageAppointments() {
  const { user } = useAuth();
  const hospitalId = user?.hospital_id;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  // Selected appointment modal
  const [selectedApt, setSelectedApt] = useState(null);

  // Walk-in appointment registration modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    department: 'General Medicine',
    appointment_date: new Date().toISOString().split('T')[0],
    time_slot: '10:00 AM - 10:30 AM',
    doctor_name: '',
    symptoms: '',
  });

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinForm.patient_name.trim() || !walkinForm.patient_phone.trim()) {
      toast.error('Please enter patient name and phone number');
      return;
    }
    setWalkinSubmitting(true);
    try {
      const res = await bookAppointment({
        hospital_id: hospitalId,
        ...walkinForm,
      });
      const data = res?.data || res;
      toast.success(`Walk-in appointment registered! Token: ${data.token_number || 'Confirmed'}`);
      setShowWalkinModal(false);
      setWalkinForm({
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        department: 'General Medicine',
        appointment_date: new Date().toISOString().split('T')[0],
        time_slot: '10:00 AM - 10:30 AM',
        doctor_name: '',
        symptoms: '',
      });
      fetchAppointments();
    } catch (err) {
      console.error('Failed to create walk-in appointment:', err);
      toast.error(err.response?.data?.message || 'Failed to register appointment');
    } finally {
      setWalkinSubmitting(false);
    }
  };

  const fetchAppointments = useCallback(async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getHospitalAppointments(hospitalId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        date: selectedDate || undefined,
        search: searchQuery || undefined,
      });
      const list = Array.isArray(res) ? res : res.data || [];
      setAppointments(list);
    } catch (err) {
      console.error('Failed to load hospital appointments:', err);
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [hospitalId, statusFilter, departmentFilter, selectedDate, searchQuery]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Real-time listener for newly booked appointments via Laravel Reverb
  useWebSocket(
    `hospital.${hospitalId}`,
    'AppointmentBooked',
    useCallback((data) => {
      toast.success(
        `New Appointment Booked: ${data.patient_name} (${data.department})`,
        { icon: '🏥', duration: 6000 }
      );
      // Prepend or refresh appointments list
      setAppointments((prev) => {
        const exists = prev.some((a) => a.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });
    }, [hospitalId])
  );

  // Real-time listener for appointment status changes
  useWebSocket(
    `hospital.${hospitalId}`,
    'AppointmentStatusUpdated',
    useCallback((data) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === data.id ? { ...a, status: data.status } : a))
      );
    }, [hospitalId])
  );

  // Status update handler
  const handleStatusChange = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      toast.success(`Appointment marked as ${newStatus}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
      if (selectedApt && selectedApt.id === appointmentId) {
        setSelectedApt((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set();
    appointments.forEach((a) => {
      if (a.department) set.add(a.department);
    });
    return Array.from(set);
  }, [appointments]);

  // Stats calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const todayCount = appointments.filter((a) => {
      const d = a.appointment_date ? a.appointment_date.split('T')[0] : '';
      return d === todayStr;
    }).length;
    return { total, confirmed, completed, cancelled, todayCount };
  }, [appointments]);

  return (
    <HospitalAdminLayout
      title="Hospital Appointments Desk"
      subtitle={hospitalId
        ? `Live schedule & token management for Hospital #${hospitalId} • Patient Care Queue`
        : 'No hospital assigned — contact your administrator'
      }
    >
      {!hospitalId ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <p className="text-white font-bold text-lg">Hospital Not Assigned</p>
          <p className="text-slate-400 text-sm max-w-md">
            Your account does not have a hospital assigned. Please contact your super administrator
            to assign you to a hospital before managing appointments.
          </p>
        </div>
      ) : (
      <>
      <div className="space-y-6">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">All-time records</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Schedule</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-indigo-400">{stats.todayCount}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Scheduled today</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmed</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.confirmed}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting visit</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-blue-400">{stats.completed}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Successfully served</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancelled</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-rose-400">{stats.cancelled}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Revoked bookings</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, phone, or token (e.g. APT-BIR)..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department & Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              />

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-rose-400 hover:underline px-1"
                >
                  Clear Date
                </button>
              )}

              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors disabled:opacity-50"
                title="Refresh Appointments"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>

              <button
                onClick={() => setShowWalkinModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Walk-in</span>
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {[
              { id: 'all', label: `All (${stats.total})` },
              { id: 'confirmed', label: `Confirmed (${stats.confirmed})`, color: 'text-emerald-400' },
              { id: 'completed', label: `Completed (${stats.completed})`, color: 'text-blue-400' },
              { id: 'cancelled', label: `Cancelled (${stats.cancelled})`, color: 'text-rose-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-cyan-600 text-white shadow shadow-cyan-950'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List / Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Hospital Appointments Log ({appointments.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Live updates active via Reverb
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No appointments found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No patient bookings match the selected filters or have been scheduled yet for this hospital.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Token & Status</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Department & Doctor</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Symptoms / Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {appointments.map((apt) => {
                    const isConfirmed = apt.status === 'confirmed';
                    const isCompleted = apt.status === 'completed';
                    const isCancelled = apt.status === 'cancelled';
                    const isBusy = updatingId === apt.id;

                    const aptDate = apt.appointment_date
                      ? typeof apt.appointment_date === 'string'
                        ? apt.appointment_date.split('T')[0]
                        : new Date(apt.appointment_date).toLocaleDateString()
                      : '—';

                    return (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                        onClick={() => setSelectedApt(apt)}
                      >
                        {/* Token & Status */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-md">
                              {apt.token_number}
                            </span>
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  isConfirmed
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : isCompleted
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                }`}
                              >
                                {isConfirmed && <CheckCircle2 className="w-2.5 h-2.5" />}
                                {isCompleted && <CheckCircle2 className="w-2.5 h-2.5" />}
                                {isCancelled && <XCircle className="w-2.5 h-2.5" />}
                                {apt.status}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Patient Details */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white text-xs flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-400" />
                              {apt.patient_name}
                            </p>
                            <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {apt.patient_phone}
                            </p>
                            {apt.patient_email && (
                              <p className="text-slate-500 text-[10px] truncate max-w-[150px]">
                                {apt.patient_email}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Department & Doctor */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200 flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-cyan-400" />
                              {apt.department}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              {apt.doctor_name ? `Dr. ${apt.doctor_name}` : 'General Consultant'}
                            </p>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {aptDate}
                            </p>
                            <p className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {apt.time_slot}
                            </p>
                          </div>
                        </td>

                        {/* Symptoms */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="text-slate-300 text-[11px] truncate">
                            {apt.symptoms || <span className="text-slate-500 italic">No symptoms noted</span>}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isConfirmed && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'completed')}
                                  disabled={isBusy}
                                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/40 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                                  title="Mark visit as completed"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                  disabled={isBusy}
                                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/40 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                                  title="Cancel this appointment"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {isCancelled && (
                              <button
                                onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                disabled={isBusy}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-all"
                              >
                                Re-open
                              </button>
                            )}

                            {isCompleted && (
                              <span className="text-[11px] font-semibold text-emerald-400/80 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Served
                              </span>
                            )}

                            <button
                              onClick={() => setSelectedApt(apt)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="View details pass"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Hospital OPD Appointment Pass
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Token: {selectedApt.token_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Status</span>
                <span
                  className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-[11px] ${
                    selectedApt.status === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedApt.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedApt.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Patient Name</p>
                  <p className="text-white font-bold">{selectedApt.patient_name}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</p>
                  <p className="text-white font-bold">{selectedApt.patient_phone}</p>
                </div>
              </div>

              {selectedApt.patient_email && (
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Email</p>
                  <p className="text-white font-medium">{selectedApt.patient_email}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Department</p>
                  <p className="text-cyan-300 font-bold">{selectedApt.department}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Doctor</p>
                  <p className="text-white font-medium">{selectedApt.doctor_name || 'General OPD'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Visit Date</p>
                  <p className="text-white font-bold">
                    {selectedApt.appointment_date
                      ? typeof selectedApt.appointment_date === 'string'
                        ? selectedApt.appointment_date.split('T')[0]
                        : new Date(selectedApt.appointment_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Time Window</p>
                  <p className="text-white font-bold">{selectedApt.time_slot}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Reported Symptoms</p>
                <p className="text-slate-300 leading-relaxed">
                  {selectedApt.symptoms || 'No specific symptoms entered by patient.'}
                </p>
              </div>
            </div>

            {/* Quick Action in Modal */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              {selectedApt.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedApt.id, 'completed')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApt.id, 'cancelled')}
                    className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 rounded-xl font-bold text-xs transition-colors"
                  >
                    Cancel Booking
                  </button>
                </>
              )}
              {selectedApt.status !== 'confirmed' && (
                <button
                  onClick={() => handleStatusChange(selectedApt.id, 'confirmed')}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Set as Confirmed
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                title="Print Pass"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Walk-in Appointment Registration Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Hospital Desk • Walk-in Booking
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Register Patient Appointment
                </h3>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Booking appointment for: <strong>Hospital #{hospitalId}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={walkinForm.patient_name}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patient_name: e.target.value })}
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={walkinForm.patient_phone}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patient_phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold text-[11px]">Patient Email (Optional)</label>
                <input
                  type="email"
                  value={walkinForm.patient_email}
                  onChange={(e) => setWalkinForm({ ...walkinForm, patient_email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">Department *</label>
                  <select
                    value={walkinForm.department}
                    onChange={(e) => setWalkinForm({ ...walkinForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'ENT', 'Dermatology', 'Gynecology'].map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">Assigned Doctor</label>
                  <input
                    type="text"
                    value={walkinForm.doctor_name}
                    onChange={(e) => setWalkinForm({ ...walkinForm, doctor_name: e.target.value })}
                    placeholder="e.g. Dr. K.P. Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={walkinForm.appointment_date}
                    onChange={(e) => setWalkinForm({ ...walkinForm, appointment_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold text-[11px]">Time Window *</label>
                  <select
                    value={walkinForm.time_slot}
                    onChange={(e) => setWalkinForm({ ...walkinForm, time_slot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {['09:00 AM - 09:30 AM', '10:00 AM - 10:30 AM', '11:00 AM - 11:30 AM', '12:00 PM - 12:30 PM', '02:00 PM - 02:30 PM', '03:00 PM - 03:30 PM', '04:00 PM - 04:30 PM'].map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold text-[11px]">Symptoms / Reasons</label>
                <textarea
                  rows={2}
                  value={walkinForm.symptoms}
                  onChange={(e) => setWalkinForm({ ...walkinForm, symptoms: e.target.value })}
                  placeholder="Reason for visit or symptoms..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkinSubmitting}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-lg shadow-cyan-950"
                >
                  {walkinSubmitting ? 'Registering...' : 'Register Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </HospitalAdminLayout>
  );
}
