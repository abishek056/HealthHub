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
import { useActiveHospital } from '../../hooks/useActiveHospital';

export default function Dashboard() {
  const { hospitalId, currentHospital } = useActiveHospital();

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
      let patientCount = 0;
      if (patientsRes.status === 'fulfilled') {
        const pData = patientsRes.value;
        patientCount = pData.total || (Array.isArray(pData) ? pData.length : 0);
        setRecentPatients(Array.isArray(pData.data) ? pData.data : Array.isArray(pData) ? pData : []);
      }

      // Appointments
      let totalApt = 0;
      let todayApt = 0;
      let confirmedApt = 0;
      if (aptsRes.status === 'fulfilled') {
        const aptList = Array.isArray(aptsRes.value)
          ? aptsRes.value
          : aptsRes.value?.data || [];
        totalApt = aptList.length;
        const todayStr = new Date().toISOString().split('T')[0];
        todayApt = aptList.filter((a) => {
          const aDate = a.appointment_date ? a.appointment_date.split('T')[0] : '';
          return aDate === todayStr;
        }).length;
        confirmedApt = aptList.filter((a) => a.status === 'confirmed').length;
        setRecentAppointments(aptList.slice(0, 6));
      }

      setStats({
        totalBeds: totalB,
        availableBeds: availB,
        activeAmbulances: activeAmb,
        totalAmbulances: totalAmb,
        avgWaitTime: avgWait,
        totalQueues: totalQ,
        patientRecordsCount: patientCount,
        totalAppointments: totalApt,
        todayAppointments: todayApt,
        confirmedAppointments: confirmedApt,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Beds</span>
              <div className="w-10 h-10 rounded-2xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.availableBeds}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {stats.totalBeds} total</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-bold">
                <span>Occupancy</span>
                <span className={occupancyRate >= 85 ? 'text-red-600' : 'text-[#167a68]'}>{occupancyRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                <div
                  className={`h-full rounded-full ${occupancyRate >= 85 ? 'bg-red-500' : 'bg-[#167a68]'}`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Appointments */}
          <Link
            to="/hospital/appointments"
            className="bg-white border border-[#c8eedc] hover:border-emerald-400 rounded-3xl p-5 shadow-xs relative overflow-hidden group transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#167a68] transition-colors">
                Appointments
              </span>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0b4d3c]">{stats.totalAppointments}</span>
              <span className="text-xs text-slate-500 font-semibold">({stats.confirmedAppointments} active)</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#167a68]" />
                {stats.todayAppointments} scheduled today
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </Link>

          {/* Card 3: Active Ambulances */}
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Ready</span>
              <div className="w-10 h-10 rounded-2xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#167a68]">{stats.activeAmbulances}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {stats.totalAmbulances} units</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live GPS broadcast active
            </p>
          </div>

          {/* Card 4: OPD Wait Time */}
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg OPD Wait</span>
              <div className="w-10 h-10 rounded-2xl bg-[#dff5ea] text-[#167a68] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{stats.avgWaitTime}</span>
              <span className="text-xs text-slate-500 font-semibold">minutes</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-[#167a68]" />
              Across {stats.totalQueues} departments
            </p>
          </div>

          {/* Card 5: Hospital Patient Records */}
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-5 shadow-xs relative overflow-hidden group hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Records</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700">{stats.patientRecordsCount}</span>
              <span className="text-xs text-slate-500 font-semibold">on file</span>
            </div>
            <p className="mt-3 text-xs text-slate-500 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#167a68]" />
              Tenant Encrypted
            </p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white border border-[#c8eedc] rounded-3xl p-6 shadow-xs">
          <h3 className="font-serif text-sm font-bold text-[#0b4d3c] uppercase tracking-wider mb-4">
            Quick Desk Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <Link
              to="/hospital/appointments"
              className="flex items-center justify-between p-3.5 bg-[#fbfdfc] hover:bg-[#dff5ea] border border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Appointments</p>
                  <p className="text-[10px] text-slate-500">Bookings ({stats.totalAppointments})</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#167a68] transition-colors" />
            </Link>

            <Link
              to="/hospital/beds"
              className="flex items-center justify-between p-3.5 bg-[#fbfdfc] hover:bg-[#dff5ea] border border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#dff5ea] text-[#167a68] group-hover:scale-105 transition-transform">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Update Beds</p>
                  <p className="text-[10px] text-slate-500">ICU & ward capacity</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#167a68] transition-colors" />
            </Link>

            <Link
              to="/hospital/ambulances"
              className="flex items-center justify-between p-3.5 bg-[#fbfdfc] hover:bg-[#dff5ea] border border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#dff5ea] text-[#167a68] group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Track Ambulance</p>
                  <p className="text-[10px] text-slate-500">Live GPS status</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#167a68] transition-colors" />
            </Link>

            <Link
              to="/hospital/opd"
              className="flex items-center justify-between p-3.5 bg-[#fbfdfc] hover:bg-[#dff5ea] border border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#dff5ea] text-[#167a68] group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Manage OPD</p>
                  <p className="text-[10px] text-slate-500">Tokens & queues</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#167a68] transition-colors" />
            </Link>

            <Link
              to="/hospital/patients"
              className="flex items-center justify-between p-3.5 bg-[#fbfdfc] hover:bg-[#dff5ea] border border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Patient Records</p>
                  <p className="text-[10px] text-slate-500">Histories & files</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-colors" />
            </Link>

            <Link
              to="/hospital/staff"
              className="flex items-center justify-between p-3.5 bg-[#fbfdfc] hover:bg-[#dff5ea] border border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Staff Desk</p>
                  <p className="text-[10px] text-slate-500">Staff accounts</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Incoming Hospital Appointments Feed */}
        <div className="bg-white border border-[#c8eedc] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <h4 className="font-serif font-bold text-base text-[#0b4d3c] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#167a68]" />
              Incoming Patient Appointments
              <span className="text-[10px] font-bold bg-[#dff5ea] border border-[#c2ebd5] text-[#0b4d3c] px-2.5 py-0.5 rounded-full">
                {stats.totalAppointments} Booked
              </span>
            </h4>
            <Link
              to="/hospital/appointments"
              className="text-xs font-bold text-[#167a68] hover:underline flex items-center gap-1"
            >
              View & Manage All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-emerald-200 rounded-2xl space-y-1.5 bg-[#fbfdfc]">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-500">No appointments booked yet for this hospital.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentAppointments.map((apt) => {
                  const isConfirmed = apt.status === 'confirmed';
                  const isCompleted = apt.status === 'completed';
                  const aptDate = apt.appointment_date
                    ? typeof apt.appointment_date === 'string'
                      ? apt.appointment_date.split('T')[0]
                      : new Date(apt.appointment_date).toLocaleDateString()
                    : '—';

                  return (
                    <div
                      key={apt.id}
                      className="p-4 bg-[#fbfdfc] rounded-2xl border border-emerald-100 hover:border-emerald-300 hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#0b4d3c] bg-[#dff5ea] px-2 py-0.5 rounded-full border border-[#c2ebd5]">
                          {apt.token_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            isConfirmed
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : isCompleted
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-900">{apt.patient_name}</p>
                        <p className="text-[11px] text-slate-500">{apt.patient_phone}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-emerald-50">
                        <span className="text-[#0b4d3c] font-semibold">{apt.department}</span>
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
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h4 className="font-serif font-bold text-base text-[#0b4d3c] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#167a68]" />
                Ward Capacity Breakdown
              </h4>
              <Link to="/hospital/beds" className="text-xs font-bold text-[#167a68] hover:underline">
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
                    <div key={bed.id} className="p-3.5 bg-[#fbfdfc] rounded-2xl border border-emerald-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{bed.ward_type} Ward</span>
                        <span className="font-bold text-[#167a68]">
                          {bed.available_beds} of {bed.total_beds} beds free
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full ${pct >= 85 ? 'bg-red-500' : 'bg-[#167a68]'}`}
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
          <div className="bg-white border border-[#c8eedc] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h4 className="font-serif font-bold text-base text-[#0b4d3c] flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Recent Patient Records
              </h4>
              <Link to="/hospital/patients" className="text-xs font-bold text-[#167a68] hover:underline">
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
                    className="p-3.5 bg-[#fbfdfc] rounded-2xl border border-emerald-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.patient_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.age} yrs • {p.diagnosis || 'General OPD'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#0b4d3c] bg-[#dff5ea] px-2.5 py-1 rounded-full border border-[#c2ebd5]">
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
