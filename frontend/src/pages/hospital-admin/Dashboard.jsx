import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import {
  BedDouble,
  Truck,
  Users,
  FileText,
  Activity,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  UserPlus,
  Calendar,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  getHospitalDetails,
  getBeds,
  getAmbulances,
  getOpdQueues,
  getPatientRecords,
  getHospitalAppointments,
} from '../../services/adminService';

export default function Dashboard() {
  const { user } = useAuth();
  const hospitalId = user?.hospital_id || 1;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBeds: 0,
    availableBeds: 0,
    activeAmbulances: 0,
    totalAmbulances: 0,
    avgWaitTime: 0,
    totalQueues: 0,
    patientRecordsCount: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    confirmedAppointments: 0,
  });
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [bedsData, setBedsData] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [hosp, bedsRes, ambRes, opdRes, patientsRes, aptsRes] = await Promise.allSettled([
        getHospitalDetails(hospitalId),
        getBeds(hospitalId),
        getAmbulances(hospitalId),
        getOpdQueues(hospitalId),
        getPatientRecords({ per_page: 5 }),
        getHospitalAppointments(hospitalId),
      ]);

      // Hospital
      if (hosp.status === 'fulfilled') {
        setHospitalInfo(hosp.value);
      }

      // Beds
      let totalB = 0;
      let availB = 0;
      if (bedsRes.status === 'fulfilled') {
        const wards = bedsRes.value?.wards || [];
        setBedsData(wards);
        wards.forEach((w) => {
          totalB += parseInt(w.total_beds, 10) || 0;
          availB += parseInt(w.available_beds, 10) || 0;
        });
      }

      // Ambulances
      let activeAmb = 0;
      let totalAmb = 0;
      if (ambRes.status === 'fulfilled') {
        const ambs = Array.isArray(ambRes.value) ? ambRes.value : [];
        totalAmb = ambs.length;
        activeAmb = ambs.filter((a) => a.is_available).length;
      }

      // OPD
      let avgWait = 0;
      let totalQ = 0;
      if (opdRes.status === 'fulfilled') {
        const queues = opdRes.value?.queues || [];
        totalQ = queues.length;
        if (totalQ > 0) {
          const sumWait = queues.reduce((acc, q) => acc + (parseInt(q.estimated_wait_mins, 10) || 0), 0);
          avgWait = Math.round(sumWait / totalQ);
        }
      }

      // Patients
      let pCount = 0;
      if (patientsRes.status === 'fulfilled') {
        const pData = patientsRes.value?.data || patientsRes.value || [];
        setRecentPatients(Array.isArray(pData) ? pData : []);
        pCount = patientsRes.value?.meta?.total || pData.length;
      }

      // Appointments
      let aptTotal = 0;
      let aptToday = 0;
      let aptConfirmed = 0;
      if (aptsRes.status === 'fulfilled') {
        const rawApts = Array.isArray(aptsRes.value) ? aptsRes.value : aptsRes.value?.data || [];
        aptTotal = rawApts.length;
        const todayStr = new Date().toISOString().split('T')[0];
        aptToday = rawApts.filter((a) => {
          const d = a.appointment_date ? a.appointment_date.split('T')[0] : '';
          return d === todayStr;
        }).length;
        aptConfirmed = rawApts.filter((a) => a.status === 'confirmed').length;
        setRecentAppointments(rawApts.slice(0, 5));
      }

      setStats({
        totalBeds: totalB,
        availableBeds: availB,
        activeAmbulances: activeAmb,
        totalAmbulances: totalAmb,
        avgWaitTime: avgWait,
        totalQueues: totalQ,
        patientRecordsCount: pCount,
        totalAppointments: aptTotal,
        todayAppointments: aptToday,
        confirmedAppointments: aptConfirmed,
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [hospitalId]);

  const occupancyRate = stats.totalBeds > 0
    ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100)
    : 0;

  return (
    <HospitalAdminLayout
      title={hospitalInfo?.name || 'Hospital Administration'}
      subtitle={`Live command center for ${hospitalInfo?.address || 'City Campus'} • Staff Operations`}
    >
      <div className="space-y-6">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Available Beds */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Beds</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats.availableBeds}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {stats.totalBeds} total</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-semibold">
                <span>Occupancy</span>
                <span className={occupancyRate >= 85 ? 'text-red-400' : 'text-emerald-400'}>{occupancyRate}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${occupancyRate >= 85 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Appointments */}
          <Link
            to="/hospital/appointments"
            className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden group transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
                Appointments
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-400">{stats.totalAppointments}</span>
              <span className="text-xs text-slate-400 font-semibold">({stats.confirmedAppointments} active)</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {stats.todayAppointments} scheduled today
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </p>
          </Link>

          {/* Card 3: Active Ambulances */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Ready</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{stats.activeAmbulances}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {stats.totalAmbulances} units</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live GPS broadcast active
            </p>
          </div>

          {/* Card 4: OPD Wait Time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg OPD Wait</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{stats.avgWaitTime}</span>
              <span className="text-xs text-slate-400 font-semibold">minutes</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Across {stats.totalQueues} departments
            </p>
          </div>

          {/* Card 5: Hospital Patient Records */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Records</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{stats.patientRecordsCount}</span>
              <span className="text-xs text-slate-400 font-semibold">on file</span>
            </div>
            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tenant Encrypted
            </p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Link
              to="/hospital/appointments"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Appointments</p>
                  <p className="text-[10px] text-slate-400">View bookings ({stats.totalAppointments})</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Link>

            <Link
              to="/hospital/beds"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Update Beds</p>
                  <p className="text-[10px] text-slate-400">ICU & ward capacity</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link
              to="/hospital/ambulances"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Track Ambulance</p>
                  <p className="text-[10px] text-slate-400">Live GPS status</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </Link>

            <Link
              to="/hospital/opd"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Manage OPD</p>
                  <p className="text-[10px] text-slate-400">Tokens & wait time</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link
              to="/hospital/patients"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Patient Records</p>
                  <p className="text-[10px] text-slate-400">Admission histories</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </Link>

            <Link
              to="/hospital/staff"
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-rose-500/50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Manage Staff</p>
                  <p className="text-[10px] text-slate-400">Staff accounts</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Incoming Hospital Appointments Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Incoming Patient Appointments
              <span className="text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-full">
                {stats.totalAppointments} Booked
              </span>
            </h4>
            <Link
              to="/hospital/appointments"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              View & Manage All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl space-y-1.5">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No appointments booked yet for this hospital.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentAppointments.map((apt) => {
                  const isConfirmed = apt.status === 'confirmed';
                  const isCompleted = apt.status === 'completed';
                  const isCancelled = apt.status === 'cancelled';
                  const aptDate = apt.appointment_date
                    ? typeof apt.appointment_date === 'string'
                      ? apt.appointment_date.split('T')[0]
                      : new Date(apt.appointment_date).toLocaleDateString()
                    : '—';

                  return (
                    <div
                      key={apt.id}
                      className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                          {apt.token_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            isConfirmed
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : isCompleted
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white">{apt.patient_name}</p>
                        <p className="text-[11px] text-slate-400">{apt.patient_phone}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-900">
                        <span className="text-cyan-300 font-medium">{apt.department}</span>
                        <span className="text-slate-400">{aptDate} • {apt.time_slot}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Two Column Grid: Ward Summary + Recent Patients Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ward Occupancy Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Ward Capacity Breakdown
              </h4>
              <Link to="/hospital/beds" className="text-xs font-semibold text-emerald-400 hover:underline">
                Manage All
              </Link>
            </div>

            <div className="space-y-3">
              {bedsData.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Loading wards data...</p>
              ) : (
                bedsData.map((bed) => {
                  const pct = bed.total_beds > 0
                    ? Math.round(((bed.total_beds - bed.available_beds) / bed.total_beds) * 100)
                    : 0;
                  return (
                    <div key={bed.id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{bed.ward_type} Ward</span>
                        <span className="font-semibold text-emerald-400">
                          {bed.available_beds} of {bed.total_beds} beds free
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 85 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Patient Admissions Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Recent Patient Records
              </h4>
              <Link to="/hospital/patients" className="text-xs font-semibold text-emerald-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentPatients.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No recent patient records found.</p>
              ) : (
                recentPatients.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{p.patient_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.age} yrs • {p.diagnosis || 'General OPD'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </HospitalAdminLayout>
  );
}
