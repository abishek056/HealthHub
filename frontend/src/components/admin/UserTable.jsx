import React from 'react';
import { Edit2, Trash2, User, Shield, Building2 } from 'lucide-react';

const ROLE_BADGES = {
  super_admin: { label: 'Super Admin', classes: 'bg-[#dff5ea] text-[#167a68] border-[#c8eedc]' },
  hospital_admin: { label: 'Hospital Admin', classes: 'bg-[#dff5ea] text-[#167a68] border-[#c8eedc]' },
  hospital_staff: { label: 'Staff', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
  patient: { label: 'Patient', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  public: { label: 'Public', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function RoleBadge({ role }) {
  const config = ROLE_BADGES[role] || ROLE_BADGES.public;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}

export default function UserTable({ users = [], onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b border-[#c8eedc]">
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="pb-3 pr-4 font-medium">Role</th>
            <th className="pb-3 pr-4 font-medium">Hospital</th>
            <th className="pb-3 pr-4 font-medium">Joined</th>
            <th className="pb-3 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100">
          {users.map((u) => (
            <tr key={u.id} className="group hover:bg-emerald-50/30 transition-colors">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#167a68] to-[#0b4d3c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4">
                <RoleBadge role={u.role} />
              </td>
              <td className="py-4 pr-4">
                {u.hospital ? (
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Building2 className="w-3.5 h-3.5" />
                    {u.hospital.name}
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="py-4 pr-4 text-slate-500 text-xs">
                {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="py-4 text-center">
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit?.(u)}
                    className="p-1.5 rounded-lg bg-[#dff5ea] hover:bg-[#c8eedc] text-[#167a68] transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete?.(u)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all"
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
