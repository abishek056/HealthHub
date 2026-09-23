import React, { useEffect, useState, useCallback } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import UserTable from '../../components/admin/UserTable';
import { getAllUsers, createUser, updateUser, deleteUser, getAllHospitals } from '../../services/superAdminService';
import { Plus, Search, X, User, AlertTriangle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['super_admin', 'hospital_admin', 'hospital_staff', 'patient'];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'hospital_staff',
  hospital_id: '',
};

function UserModal({ user: initialUser, hospitals, onClose, onSave }) {
  const [form, setForm] = useState(
    initialUser ? { ...initialUser, password: '' } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initialUser?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      await onSave(payload);
      toast.success(isEdit ? 'User updated!' : 'User created!');
      onClose();
    } catch {
      toast.error('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const needsHospital = ['hospital_admin', 'hospital_staff'].includes(form.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white border border-[#c8eedc] rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c8eedc]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#dff5ea] border border-[#c8eedc] flex items-center justify-center">
              <User className="w-4 h-4 text-[#167a68]" />
            </div>
            <h2 className="text-slate-900 font-semibold">{isEdit ? 'Edit User' : 'Add New User'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-slate-900 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-slate-500 text-xs font-medium mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#167a68] transition-colors"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-slate-500 text-xs font-medium mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#167a68] transition-colors"
            />
          </div>
          {/* Password */}
          <div>
            <label className="block text-slate-500 text-xs font-medium mb-1.5">
              Password {isEdit && <span className="text-slate-600">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#167a68] transition-colors"
            />
          </div>
          {/* Role */}
          <div>
            <label className="block text-slate-500 text-xs font-medium mb-1.5">Role</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, hospital_id: '' }))}
                className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:border-[#167a68] transition-colors"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          {/* Hospital */}
          {needsHospital && (
            <div>
              <label className="block text-slate-500 text-xs font-medium mb-1.5">Assigned Hospital</label>
              <div className="relative">
                <select
                  value={form.hospital_id}
                  onChange={(e) => setForm((f) => ({ ...f, hospital_id: e.target.value }))}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:border-[#167a68] transition-colors"
                >
                  <option value="">— Select Hospital —</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUserModal({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      toast.success('User deleted');
      onClose();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-[#c8eedc] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-slate-900 font-semibold">Delete User</h2>
            <p className="text-slate-500 text-sm">This action is irreversible</p>
          </div>
        </div>
        <p className="text-slate-600 text-sm mb-6">
          Are you sure you want to delete <strong>{user.name}</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-sm font-medium transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ search, role: roleFilter });
      setUsers(res.data ?? res ?? []);
    } catch {
      setUsers([
        { id: 1, name: 'Abishek Shrestha', email: 'abishek@healthhub.com', role: 'super_admin', created_at: '2024-01-10' },
        { id: 2, name: 'Dr. Sita Rana', email: 'sita@birhospital.com', role: 'hospital_admin', hospital: { name: 'Bir Hospital' }, created_at: '2024-02-14' },
        { id: 3, name: 'Ram Bahadur', email: 'ram@patan.com', role: 'hospital_staff', hospital: { name: 'Patan Hospital' }, created_at: '2024-03-01' },
        { id: 4, name: 'Gita Thapa', email: 'gita@example.com', role: 'public', created_at: '2024-03-20' },
        { id: 5, name: 'Hari Prasad', email: 'hari@tuth.com', role: 'hospital_staff', hospital: { name: 'TUTH' }, created_at: '2024-04-05' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    getAllHospitals()
      .then((res) => setHospitals(res.data ?? res ?? []))
      .catch(() => setHospitals([
        { id: 1, name: 'Bir Hospital' },
        { id: 2, name: 'Patan Hospital' },
        { id: 3, name: 'TUTH' },
      ]));
  }, []);

  const handleSave = async (form) => {
    if (modal?.data?.id) {
      await updateUser(modal.data.id, form);
    } else {
      await createUser(form);
    }
    fetchUsers();
  };

  const handleDelete = async () => {
    await deleteUser(modal.data.id);
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-sm font-medium transition-colors shadow-lg shadow-[#167a68]/20"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#167a68] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#c8eedc] rounded-xl px-4 py-2.5 text-sm text-slate-900 appearance-none focus:outline-none focus:border-[#167a68] transition-colors pr-8"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#c8eedc] p-6">
        <UserTable
          users={filtered}
          loading={loading}
          onEdit={(u) => setModal({ type: 'edit', data: u })}
          onDelete={(u) => setModal({ type: 'delete', data: u })}
        />
      </div>

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <UserModal
          user={modal.data}
          hospitals={hospitals}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteUserModal
          user={modal.data}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </SuperAdminLayout>
  );
}
