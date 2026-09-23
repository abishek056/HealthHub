import React, { useEffect, useState } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import BedOccupancyChart from '../../components/charts/BedOccupancyChart';
import AmbulanceResponseChart from '../../components/charts/AmbulanceResponseChart';
import {
  Building2,
  BedDouble,
  Ambulance,
  Users,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { getGlobalStats } from '../../services/superAdminService';

function StatCard({ icon: Icon, label, value, sub, trend, color = 'emerald' }) {
  const iconColors = {
    indigo: 'bg-[#eaf8f1] text-[#0b4d3c]',
    emerald: 'bg-[#dff5ea] text-[#167a68]',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-[#dff5ea] text-[#167a68]',
  };

  return (
    <div className="rounded-3xl bg-white border border-[#c8eedc] p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${iconColors[color] || iconColors.emerald}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
              trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value ?? '—'}</p>
        <p className="text-slate-600 text-sm font-semibold mt-0.5">{label}</p>
        {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// Mock recent alerts
const ALERTS = [
  { id: 1, type: 'warning', msg: 'Grande Hospital: ICU beds at 95% capacity', time: '5 min ago' },
  { id: 2, type: 'info', msg: 'New hospital staff account created at TUTH', time: '22 min ago' },
  { id: 3, type: 'warning', msg: 'Ambulance #AMB-007 offline for 30+ minutes', time: '1 hr ago' },
  { id: 4, type: 'success', msg: 'Patan Hospital updated OPD queue successfully', time: '2 hr ago' },
];

const ALERT_STYLES = {
  warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
  info: 'border-emerald-200 bg-[#eaf8f1] text-[#0b4d3c]',
  success: 'border-emerald-200 bg-[#dff5ea] text-emerald-900',
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalStats()
      .then((res) => setStats(res.data ?? res))
      .catch(() => {
        // Use mock data if API unavailable
        setStats({
          total_hospitals: 24,
          total_beds: 3840,
          available_beds: 1126,
          total_ambulances: 87,
          active_ambulances: 34,
          total_users: 412,
          avg_wait_time: 18,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4d3c]">System Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time aggregated health infrastructure telemetry across Nepal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Building2}
          label="Total Hospitals"
          value={loading ? '...' : (stats?.hospitals?.total ?? stats?.total_hospitals ?? '—')}
          sub="Across all provinces"
          trend={4}
          color="emerald"
        />
        <StatCard
          icon={BedDouble}
          label="Available Beds"
          value={loading ? '...' : `${stats?.beds?.available ?? stats?.available_beds ?? '—'} / ${stats?.beds?.total ?? stats?.total_beds ?? '—'}`}
          sub="System-wide capacity"
          trend={-2}
          color="emerald"
        />
        <StatCard
          icon={Ambulance}
          label="Active Ambulances"
          value={loading ? '...' : `${stats?.ambulances?.available ?? stats?.active_ambulances ?? '—'} / ${stats?.ambulances?.total ?? stats?.total_ambulances ?? '—'}`}
          sub="Currently deployed"
          trend={7}
          color="amber"
        />
        <StatCard
          icon={Users}
          label="Registered Users"
          value={loading ? '...' : (stats?.users?.total ?? stats?.total_users ?? '—')}
          sub="All roles combined"
          trend={12}
          color="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl border border-[#c8eedc] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base font-bold text-[#0b4d3c]">Bed Occupancy Trend</h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">Last 7 days</span>
          </div>
          <BedOccupancyChart />
        </div>
        <div className="bg-white rounded-3xl border border-[#c8eedc] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base font-bold text-[#0b4d3c]">Ambulance Response Times</h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">Avg. minutes</span>
          </div>
          <AmbulanceResponseChart />
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-3xl border border-[#c8eedc] p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h2 className="font-serif text-base font-bold text-[#0b4d3c]">Recent System Alerts</h2>
        </div>
        <div className="space-y-3">
          {ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start justify-between border rounded-2xl px-4 py-3.5 ${ALERT_STYLES[alert.type]}`}
            >
              <p className="text-xs sm:text-sm font-semibold">{alert.msg}</p>
              <div className="flex items-center gap-1 text-xs opacity-75 ml-4 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {alert.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
