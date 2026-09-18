import React from 'react';
import { Edit2, Trash2, MapPin, Phone, BedDouble, Ambulance } from 'lucide-react';

export default function HospitalTable({ hospitals = [], onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!hospitals.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <BedDouble className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No hospitals found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="pb-3 pr-4 font-medium">Hospital</th>
            <th className="pb-3 pr-4 font-medium">Location</th>
            <th className="pb-3 pr-4 font-medium text-center">Beds</th>
            <th className="pb-3 pr-4 font-medium text-center">Ambulances</th>
            <th className="pb-3 pr-4 font-medium">Contact</th>
            <th className="pb-3 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {hospitals.map((h) => (
            <tr key={h.id} className="group hover:bg-slate-800/30 transition-colors">
              <td className="py-4 pr-4">
                <div>
                  <p className="text-white font-medium">{h.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">ID #{h.id}</p>
                </div>
              </td>
              <td className="py-4 pr-4">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">{h.address || h.location || '—'}</span>
                </div>
              </td>
              <td className="py-4 pr-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-white font-semibold">{h.available_beds ?? h.beds_available ?? '—'}</span>
                  <span className="text-slate-500 text-xs">/ {h.total_beds ?? h.beds_total ?? '—'}</span>
                </div>
              </td>
              <td className="py-4 pr-4 text-center">
                <span className="inline-flex items-center gap-1 text-white font-semibold">
                  <Ambulance className="w-3.5 h-3.5 text-indigo-400" />
                  {h.ambulances_count ?? h.ambulance_count ?? '—'}
                </span>
              </td>
              <td className="py-4 pr-4">
                {h.phone ? (
                  <a
                    href={`tel:${h.phone}`}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {h.phone}
                  </a>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="py-4 text-center">
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit?.(h)}
                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete?.(h)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
