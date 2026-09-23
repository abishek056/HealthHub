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
      <div className="bg-white border border-[#c8eedc] rounded-xl p-3 shadow-xl">
        <p className="text-slate-500 text-xs mb-1 font-medium">{label}</p>
        <p className="text-slate-900 font-semibold text-sm">
          {payload[0].value} <span className="text-slate-500 font-normal">min avg</span>
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
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="hospital"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          unit="m"
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22, 122, 104, 0.06)' }} />
        <Bar dataKey="avgMinutes" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
