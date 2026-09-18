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

function StatCard({ icon: Icon, label, value, sub, trend, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    rose: 'from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} border p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl bg-slate-900/60`}>
          <Icon className={`w-5 h-5 ${colors[color].split(' ')[3]}`} />
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-slate-400 text-sm mt-0.5">{label}</p>
        {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
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
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  info: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
  success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
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
        <h1 className="text-2xl font-bold text-white">System Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time aggregated health infrastructure data
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Building2}
          label="Total Hospitals"
          value={loading ? '...' : (stats?.hospitals?.total ?? stats?.total_hospitals ?? '—')}
          sub="Across all regions"
          trend={4}
          color="indigo"
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
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Bed Occupancy Trend</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">Last 7 days</span>
          </div>
          <BedOccupancyChart />
        </div>
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Ambulance Response Times</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">Avg. minutes</span>
          </div>
          <AmbulanceResponseChart />
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h2 className="text-white font-semibold">Recent System Alerts</h2>
        </div>
        <div className="space-y-3">
          {ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start justify-between border rounded-xl px-4 py-3 ${ALERT_STYLES[alert.type]}`}
            >
              <p className="text-sm">{alert.msg}</p>
              <div className="flex items-center gap-1 text-xs opacity-60 ml-4 whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {alert.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
