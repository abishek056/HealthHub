import React from 'react';
import { Edit2, Trash2, User, Shield, Building2 } from 'lucide-react';

const ROLE_BADGES = {
  super_admin: { label: 'Super Admin', classes: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  hospital_admin: { label: 'Hospital Admin', classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  hospital_staff: { label: 'Staff', classes: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  patient: { label: 'Patient', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  public: { label: 'Public', classes: 'bg-slate-700/60 text-slate-400 border-slate-600' },
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
          <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
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
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="pb-3 pr-4 font-medium">User</th>
            <th className="pb-3 pr-4 font-medium">Role</th>
            <th className="pb-3 pr-4 font-medium">Hospital</th>
            <th className="pb-3 pr-4 font-medium">Joined</th>
            <th className="pb-3 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {users.map((u) => (
            <tr key={u.id} className="group hover:bg-slate-800/30 transition-colors">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4">
                <RoleBadge role={u.role} />
              </td>
              <td className="py-4 pr-4">
                {u.hospital ? (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Building2 className="w-3.5 h-3.5" />
                    {u.hospital.name}
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="py-4 pr-4 text-slate-400 text-xs">
                {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="py-4 text-center">
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit?.(u)}
                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete?.(u)}
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
