import React, { useEffect, useState } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import BedOccupancyChart from '../../components/charts/BedOccupancyChart';
import AmbulanceResponseChart from '../../components/charts/AmbulanceResponseChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { getBedOccupancyTrend, getAmbulanceResponseTimes, getOpdWaitTimes } from '../../services/superAdminService';
import { TrendingUp, Clock, Activity, BarChart3 } from 'lucide-react';

// ── OPD Wait Time Chart ────────────────────────────────────────────────
const OPD_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

const OPD_MOCK = [
  { department: 'General', waitMinutes: 22 },
  { department: 'Cardiology', waitMinutes: 38 },
  { department: 'Orthopedics', waitMinutes: 45 },
  { department: 'Pediatrics', waitMinutes: 19 },
  { department: 'ENT', waitMinutes: 31 },
];

const OpdTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold text-sm">{payload[0].value} <span className="text-slate-400 font-normal text-xs">min avg wait</span></p>
      </div>
    );
  }
  return null;
};

function OpdWaitChart({ data }) {
  const chartData = data?.length ? data : OPD_MOCK;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
        <YAxis dataKey="department" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<OpdTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Bar dataKey="waitMinutes" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={OPD_COLORS[i % OPD_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── System Performance Line Chart ─────────────────────────────────────
const PERF_MOCK = [
  { hour: '00:00', response: 120, throughput: 34 },
  { hour: '04:00', response: 95, throughput: 18 },
  { hour: '08:00', response: 210, throughput: 87 },
  { hour: '12:00', response: 285, throughput: 143 },
  { hour: '16:00', response: 198, throughput: 112 },
  { hour: '20:00', response: 155, throughput: 76 },
  { hour: '23:59', response: 102, throughput: 41 },
];

const PerfTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-semibold">{p.value}{p.name === 'Avg Response' ? 'ms' : ' req/h'}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function SystemPerfChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={PERF_MOCK} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<PerfTooltip />} />
        <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v}</span>} />
        <Line type="monotone" dataKey="response" name="Avg Response" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="throughput" name="Throughput" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── KPI Tiles ─────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-slate-400 text-sm">{label}</p>
        {sub && <p className="text-slate-600 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [bedData, setBedData] = useState([]);
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [opdData, setOpdData] = useState([]);

  useEffect(() => {
    getBedOccupancyTrend().then((res) => setBedData(res.data ?? [])).catch(() => setBedData([]));
    getAmbulanceResponseTimes().then((res) => setAmbulanceData(res.data ?? [])).catch(() => setAmbulanceData([]));
    getOpdWaitTimes().then((res) => setOpdData(res.data ?? [])).catch(() => setOpdData([]));
  }, []);

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">System Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time performance metrics across all hospitals</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={TrendingUp} label="Avg Bed Occupancy" value="74%" sub="All hospitals" color="indigo" />
        <KpiCard icon={Clock} label="Avg Ambulance Response" value="10.3m" sub="System-wide" color="emerald" />
        <KpiCard icon={Activity} label="Avg OPD Wait Time" value="31m" sub="Across departments" color="amber" />
        <KpiCard icon={BarChart3} label="API Uptime" value="99.7%" sub="Last 30 days" color="rose" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Bed Occupancy by Ward</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">7-day trend</span>
          </div>
          <BedOccupancyChart data={bedData} />
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Ambulance Response Times</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">Per hospital</span>
          </div>
          <AmbulanceResponseChart data={ambulanceData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">OPD Wait Times by Department</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">Avg. minutes</span>
          </div>
          <OpdWaitChart data={opdData} />
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">System Performance (Today)</h2>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">Hourly</span>
          </div>
          <SystemPerfChart />
        </div>
      </div>
    </SuperAdminLayout>
  );
}
