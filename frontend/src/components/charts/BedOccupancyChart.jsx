import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#c8eedc] rounded-xl p-3 shadow-xl">
        <p className="text-slate-500 text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="text-slate-900 font-semibold">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Fallback mock data if API returns nothing
const MOCK_DATA = [
  { date: 'Sep 13', ICU: 78, General: 62, Emergency: 85 },
  { date: 'Sep 14', ICU: 82, General: 65, Emergency: 90 },
  { date: 'Sep 15', ICU: 75, General: 70, Emergency: 80 },
  { date: 'Sep 16', ICU: 88, General: 68, Emergency: 92 },
  { date: 'Sep 17', ICU: 91, General: 72, Emergency: 88 },
  { date: 'Sep 18', ICU: 84, General: 69, Emergency: 76 },
  { date: 'Sep 19', ICU: 79, General: 74, Emergency: 83 },
];

export default function BedOccupancyChart({ data }) {
  const chartData = data?.length ? data : MOCK_DATA;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="icuGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="generalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="emergencyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 16 }}
          formatter={(val) => <span className="text-slate-600 text-xs font-medium">{val}</span>}
        />
        <Area type="monotone" dataKey="ICU" stroke="#f43f5e" strokeWidth={2} fill="url(#icuGrad)" dot={false} />
        <Area type="monotone" dataKey="General" stroke="#6366f1" strokeWidth={2} fill="url(#generalGrad)" dot={false} />
        <Area type="monotone" dataKey="Emergency" stroke="#f59e0b" strokeWidth={2} fill="url(#emergencyGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
