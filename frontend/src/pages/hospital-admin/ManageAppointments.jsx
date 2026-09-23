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
import { useActiveHospital } from '../../hooks/useActiveHospital';

export default function ManageAppointments() {
  const { hospitalId, currentHospital } = useActiveHospital();

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

  // Completion modal state with problem diagnosis
  const [completingApt, setCompletingApt] = useState(null);
  const [completingSubmitting, setCompletingSubmitting] = useState(false);
  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis: '',
    treatment: '',
    age: '30',
    gender: 'male',
  });

  const openCompleteModal = (apt) => {
    setCompletingApt(apt);
    setDiagnosisForm({
      diagnosis: apt.symptoms ? `Diagnosed for: ${apt.symptoms}` : '',
      treatment: '',
      age: '30',
      gender: 'male',
    });
  };

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
  const handleStatusChange = async (appointmentId, newStatus, extra = {}) => {
    setUpdatingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus, extra);
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

  const handleCompleteSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!completingApt) return;

    setCompletingSubmitting(true);
    try {
      const res = await updateAppointmentStatus(completingApt.id, 'completed', {
        diagnosis: diagnosisForm.diagnosis || undefined,
        treatment: diagnosisForm.treatment || undefined,
        age: diagnosisForm.age ? parseInt(diagnosisForm.age, 10) : 30,
        gender: diagnosisForm.gender || 'other',
      });
      const updatedItem = res?.data || {
        ...completingApt,
        status: 'completed',
        diagnosis: diagnosisForm.diagnosis,
        treatment: diagnosisForm.treatment,
      };
      toast.success('Visit marked completed & recorded in Patient Details!');
      setAppointments((prev) =>
        prev.map((a) => (a.id === completingApt.id ? { ...a, ...updatedItem, status: 'completed' } : a))
      );
      if (selectedApt && selectedApt.id === completingApt.id) {
        setSelectedApt((prev) => ({ ...prev, ...updatedItem, status: 'completed' }));
      }
      setCompletingApt(null);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to complete appointment.');
    } finally {
      setCompletingSubmitting(false);
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
          <p className="text-slate-900 font-bold text-lg">Hospital Not Assigned</p>
          <p className="text-slate-500 text-sm max-w-md">
            Your account does not have a hospital assigned. Please contact your super administrator
            to assign you to a hospital before managing appointments.
          </p>
        </div>
      ) : (
      <>
      <div className="space-y-6">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">All-time records</p>
            </div>
          </div>

          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Schedule</span>
              <div className="w-8 h-8 rounded-xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-[#167a68]">{stats.todayCount}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Scheduled today</p>
            </div>
          </div>

          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed</span>
              <div className="w-8 h-8 rounded-xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-[#167a68]">{stats.confirmed}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Awaiting visit</p>
            </div>
          </div>

          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.completed}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Successfully served</p>
            </div>
          </div>

          <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-rose-600">{stats.cancelled}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Revoked bookings</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-[#c8eedc] rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, phone, or token (e.g. APT-BIR)..."
                className="w-full bg-white border border-[#c8eedc] focus:border-cyan-500/50 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
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
                className="bg-white border border-[#c8eedc] text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/50"
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
                className="bg-white border border-[#c8eedc] text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500/50"
              />

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-rose-600 hover:underline px-1 font-medium"
                >
                  Clear Date
                </button>
              )}

              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors disabled:opacity-50 border border-slate-200 cursor-pointer"
                title="Refresh Appointments"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#167a68]' : 'text-slate-600'}`} />
              </button>

              <button
                onClick={() => setShowWalkinModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#167a68] hover:bg-[#116253] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Walk-in</span>
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-emerald-100/80">
            <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {[
              { id: 'all', label: `All (${stats.total})` },
              { id: 'confirmed', label: `Confirmed (${stats.confirmed})`, color: 'text-[#167a68]' },
              { id: 'completed', label: `Completed (${stats.completed})`, color: 'text-blue-700' },
              { id: 'cancelled', label: `Cancelled (${stats.cancelled})`, color: 'text-rose-700' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#167a68] text-white shadow-xs'
                    : 'bg-[#fbfdfc] text-slate-600 hover:text-slate-900 hover:bg-emerald-50 border border-emerald-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List / Table */}
        <div className="bg-white border border-[#c8eedc] rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-emerald-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#167a68]" />
              Hospital Appointments Log ({appointments.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Live updates active via Reverb
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-900">No appointments found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No patient bookings match the selected filters or have been scheduled yet for this hospital.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 bg-[#f0faf5] text-[#0b4d3c] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Token & Status</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Department & Doctor</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Symptoms / Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
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
                        className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedApt(apt)}
                      >
                        {/* Token & Status */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-[#0b4d3c] text-xs bg-[#dff5ea] border border-[#c2ebd5] px-2 py-0.5 rounded-md">
                              {apt.token_number}
                            </span>
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  isConfirmed
                                    ? 'bg-[#dff5ea] border-[#c8eedc] text-[#167a68]'
                                    : isCompleted
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
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
                            <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-500" />
                              {apt.patient_name}
                            </p>
                            <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
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
                            <p className="font-semibold text-slate-800 flex items-center gap-1">
                              <Stethoscope className="w-3 h-3 text-[#167a68]" />
                              {apt.department}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              {apt.doctor_name ? `Dr. ${apt.doctor_name}` : 'General Consultant'}
                            </p>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {aptDate}
                            </p>
                            <p className="text-slate-500 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {apt.time_slot}
                            </p>
                          </div>
                        </td>

                        {/* Symptoms */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="text-slate-700 text-[11px] truncate">
                            {apt.symptoms || <span className="text-slate-500 italic">No symptoms noted</span>}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isConfirmed && (
                              <>
                                <button
                                  onClick={() => openCompleteModal(apt)}
                                  disabled={isBusy}
                                  className="px-2.5 py-1 bg-[#dff5ea] hover:bg-[#167a68] text-[#167a68] hover:text-white border border-[#c8eedc] rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
                                  title="Complete visit & record diagnosis"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleStatusChange(apt.id, 'cancelled')}
                                  disabled={isBusy}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
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
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                              >
                                Re-open
                              </button>
                            )}

                            {isCompleted && (
                              <span className="text-[11px] font-semibold text-[#167a68] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Served
                              </span>
                            )}

                            <button
                              onClick={() => setSelectedApt(apt)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-emerald-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#fbfdfc]/80 backdrop-blur-sm">
          <div className="bg-white border border-[#c8eedc] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#167a68]">
                  Hospital OPD Appointment Pass
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Token: {selectedApt.token_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-emerald-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-3 bg-[#fbfdfc]/60 rounded-xl border border-emerald-100">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-[11px] ${
                    selectedApt.status === 'confirmed'
                      ? 'bg-[#dff5ea] text-[#167a68] border border-[#c8eedc]'
                      : selectedApt.status === 'completed'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {selectedApt.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Patient Name</p>
                  <p className="text-slate-900 font-bold">{selectedApt.patient_name}</p>
                </div>
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Phone Number</p>
                  <p className="text-slate-900 font-bold">{selectedApt.patient_phone}</p>
                </div>
              </div>

              {selectedApt.patient_email && (
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Email</p>
                  <p className="text-slate-900 font-medium">{selectedApt.patient_email}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Department</p>
                  <p className="text-[#0b4d3c] font-bold">{selectedApt.department}</p>
                </div>
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Assigned Doctor</p>
                  <p className="text-slate-900 font-medium">{selectedApt.doctor_name || 'General OPD'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Visit Date</p>
                  <p className="text-slate-900 font-bold">
                    {selectedApt.appointment_date
                      ? typeof selectedApt.appointment_date === 'string'
                        ? selectedApt.appointment_date.split('T')[0]
                        : new Date(selectedApt.appointment_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Time Window</p>
                  <p className="text-slate-900 font-bold">{selectedApt.time_slot}</p>
                </div>
              </div>

              <div className="p-3 bg-[#fbfdfc]/40 rounded-xl border border-emerald-100/80 space-y-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Reported Symptoms</p>
                <p className="text-slate-700 leading-relaxed">
                  {selectedApt.symptoms || 'No specific symptoms entered by patient.'}
                </p>
              </div>

              {/* Completed Visit Clinical Notes */}
              {(selectedApt.diagnosis || selectedApt.patient_record?.diagnosis) && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <p className="text-[#0b4d3c] text-[10px] uppercase font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#167a68]" /> Clinical Diagnosis
                  </p>
                  <p className="text-slate-900 font-semibold leading-relaxed">
                    {selectedApt.diagnosis || selectedApt.patient_record?.diagnosis}
                  </p>
                </div>
              )}

              {(selectedApt.treatment || selectedApt.patient_record?.treatment) && (
                <div className="p-3 bg-[#fbfdfc] rounded-xl border border-emerald-100 space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">
                    Prescribed Treatment & Prescriptions
                  </p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedApt.treatment || selectedApt.patient_record?.treatment}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action in Modal */}
            <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
              {selectedApt.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => {
                      const apt = selectedApt;
                      setSelectedApt(null);
                      openCompleteModal(apt);
                    }}
                    className="flex-1 py-2.5 bg-[#167a68] hover:bg-[#116253] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApt.id, 'cancelled')}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                </>
              )}
              {selectedApt.status !== 'confirmed' && (
                <button
                  onClick={() => handleStatusChange(selectedApt.id, 'confirmed')}
                  className="flex-1 py-2.5 bg-[#167a68] hover:bg-[#116253] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Set as Confirmed
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[#c8eedc] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#167a68]">
                  Hospital Desk • Walk-in Booking
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Register Patient Appointment
                </h3>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-emerald-50 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-[#dff5ea]/30 border border-[#c2ebd5]/40 rounded-xl text-[#0b4d3c] flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0 text-[#167a68]" />
                <span>Booking appointment for: <strong>Hospital #{hospitalId}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold text-[11px]">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={walkinForm.patient_name}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patient_name: e.target.value })}
                    placeholder="Full Name"
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold text-[11px]">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={walkinForm.patient_phone}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patient_phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold text-[11px]">Patient Email (Optional)</label>
                <input
                  type="email"
                  value={walkinForm.patient_email}
                  onChange={(e) => setWalkinForm({ ...walkinForm, patient_email: e.target.value })}
                  placeholder="patient@example.com"
                  className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold text-[11px]">Department *</label>
                  <select
                    value={walkinForm.department}
                    onChange={(e) => setWalkinForm({ ...walkinForm, department: e.target.value })}
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  >
                    {['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'ENT', 'Dermatology', 'Gynecology'].map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold text-[11px]">Assigned Doctor</label>
                  <input
                    type="text"
                    value={walkinForm.doctor_name}
                    onChange={(e) => setWalkinForm({ ...walkinForm, doctor_name: e.target.value })}
                    placeholder="e.g. Dr. K.P. Sharma"
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold text-[11px]">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={walkinForm.appointment_date}
                    onChange={(e) => setWalkinForm({ ...walkinForm, appointment_date: e.target.value })}
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold text-[11px]">Time Window *</label>
                  <select
                    value={walkinForm.time_slot}
                    onChange={(e) => setWalkinForm({ ...walkinForm, time_slot: e.target.value })}
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  >
                    {['09:00 AM - 09:30 AM', '10:00 AM - 10:30 AM', '11:00 AM - 11:30 AM', '12:00 PM - 12:30 PM', '02:00 PM - 02:30 PM', '03:00 PM - 03:30 PM', '04:00 PM - 04:30 PM'].map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold text-[11px]">Symptoms / Reasons</label>
                <textarea
                  rows={2}
                  value={walkinForm.symptoms}
                  onChange={(e) => setWalkinForm({ ...walkinForm, symptoms: e.target.value })}
                  placeholder="Reason for visit or symptoms..."
                  className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkinSubmitting}
                  className="flex-1 py-2.5 bg-[#167a68] hover:bg-[#116253] text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {walkinSubmitting ? 'Registering...' : 'Register Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Appointment & Add Problem Diagnosis Modal */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#c8eedc] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#167a68]">
                  Complete Patient Visit
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Record Diagnosis & Finish Consultation
                </h3>
              </div>
              <button
                onClick={() => setCompletingApt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-emerald-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Header Summary */}
            <div className="bg-[#f0faf5] rounded-2xl p-3.5 border border-[#c2ebd5] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-[#0b4d3c] bg-white px-2 py-0.5 rounded border border-[#c8eedc]">
                    {completingApt.token_number}
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{completingApt.patient_name}</p>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {completingApt.department} • {completingApt.doctor_name ? `Dr. ${completingApt.doctor_name}` : 'General Consultant'}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-medium">{completingApt.patient_phone}</p>
              </div>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold text-[11px]">Patient Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={diagnosisForm.age}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, age: e.target.value })}
                    placeholder="e.g. 30"
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold text-[11px]">Gender</label>
                  <select
                    value={diagnosisForm.gender}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, gender: e.target.value })}
                    className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold text-[11px] flex items-center justify-between">
                  <span>Problem Diagnosis <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-500 font-normal">Auto-saved to Patient Details</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={diagnosisForm.diagnosis}
                  onChange={(e) => setDiagnosisForm({ ...diagnosisForm, diagnosis: e.target.value })}
                  placeholder="Enter medical diagnosis (e.g. Acute viral rhinitis, Type 2 Diabetes, Migraine)..."
                  className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold text-[11px]">
                  Treatment & Prescriptions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={diagnosisForm.treatment}
                  onChange={(e) => setDiagnosisForm({ ...diagnosisForm, treatment: e.target.value })}
                  placeholder="Prescribed medicine, dosage, clinical advice..."
                  className="w-full bg-[#fbfdfc] border border-emerald-100 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#167a68]"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-[#0b4d3c] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#167a68] shrink-0 mt-0.5" />
                <span>
                  Completing this visit will automatically add this patient to the <strong>Patient Records</strong> (Patient Details) section with this diagnosis, where staff can view or update it anytime.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setCompletingApt(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingSubmitting}
                  className="flex-1 py-2.5 bg-[#167a68] hover:bg-[#116253] text-white rounded-xl font-bold text-xs transition-colors disabled:opacity-50 shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completingSubmitting ? 'Saving...' : 'Complete & Save Diagnosis'}
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
