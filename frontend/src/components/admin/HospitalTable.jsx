import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, MapPin, Phone, BedDouble, Ambulance, ExternalLink } from 'lucide-react';

export default function HospitalTable({ hospitals = [], onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
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
          <tr className="text-left text-slate-500 border-b border-[#c8eedc]">
            <th className="pb-3 pr-4 font-medium">Hospital</th>
            <th className="pb-3 pr-4 font-medium">Location</th>
            <th className="pb-3 pr-4 font-medium text-center">Beds</th>
            <th className="pb-3 pr-4 font-medium text-center">Ambulances</th>
            <th className="pb-3 pr-4 font-medium">Contact</th>
            <th className="pb-3 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100">
          {hospitals.map((h) => {
            const totalBeds = Number(h.total_beds ?? h.beds_total ?? 0);
            const availBeds = Number(h.available_beds ?? h.beds_available ?? 0);
            const ambCount = Number(h.ambulances_count ?? h.ambulance_count ?? 0);

            return (
              <tr key={h.id} className="group hover:bg-emerald-50/30 transition-colors">
                <td className="py-4 pr-4">
                  <div>
                    <p className="text-slate-900 font-medium">{h.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">ID #{h.id}</p>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">{h.address || h.location || '—'}</span>
                  </div>
                </td>
                <td className="py-4 pr-4 text-center">
                  <div className="flex flex-col items-center">
                    {totalBeds === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        0 / 0
                      </span>
                    ) : (
                      <>
                        <span className="text-slate-900 font-semibold">{availBeds}</span>
                        <span className="text-slate-500 text-xs">/ {totalBeds}</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-4 pr-4 text-center">
                  <span className="inline-flex items-center gap-1 text-slate-900 font-semibold">
                    <Ambulance className="w-3.5 h-3.5 text-[#167a68]" />
                    {ambCount}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  {h.phone ? (
                    <a
                      href={`tel:${h.phone}`}
                      className="flex items-center gap-1.5 text-[#167a68] hover:underline text-xs transition-colors"
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
                    <Link
                      to={`/hospital/dashboard?hospital_id=${h.id}`}
                      onClick={() => localStorage.setItem('healthhub_selected_hospital_id', h.id)}
                      className="p-1.5 rounded-lg bg-[#dff5ea] hover:bg-[#c8eedc] text-[#167a68] transition-all flex items-center gap-1 text-xs font-semibold"
                      title="Open Hospital Dashboard (add beds, fleet, OPD)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Manage</span>
                    </Link>
                    <button
                      onClick={() => onEdit?.(h)}
                      className="p-1.5 rounded-lg bg-[#dff5ea] hover:bg-[#c8eedc] text-[#167a68] transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete?.(h)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
