import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold text-sm">
          {payload[0].value} <span className="text-slate-400 font-normal">min avg</span>
        </p>
      </div>
    );
  }
  return null;
};

const MOCK_DATA = [
  { hospital: 'Bir Hospital', avgMinutes: 8.2 },
  { hospital: 'Patan Hospital', avgMinutes: 11.5 },
  { hospital: 'TUTH', avgMinutes: 6.8 },
  { hospital: 'Grande', avgMinutes: 14.3 },
  { hospital: 'Norvic', avgMinutes: 9.1 },
  { hospital: 'Om Hospital', avgMinutes: 12.7 },
];

export default function AmbulanceResponseChart({ data }) {
  const chartData = data?.length ? data : MOCK_DATA;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="hospital"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          unit="m"
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
        <Bar dataKey="avgMinutes" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
