import React, { useEffect, useState, useCallback } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import HospitalTable from '../../components/admin/HospitalTable';
import { getAllHospitals, createHospital, updateHospital, deleteHospital } from '../../services/superAdminService';
import { Plus, Search, X, Building2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  address: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
};

function HospitalModal({ hospital, onClose, onSave }) {
  const [form, setForm] = useState(hospital ? { ...hospital } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(hospital?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      toast.success(isEdit ? 'Hospital updated!' : 'Hospital created!');
      onClose();
    } catch {
      toast.error('Failed to save hospital');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Hospital Name', required: true, colSpan: 2 },
    { key: 'address', label: 'Address', required: true, colSpan: 2 },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'latitude', label: 'Latitude', type: 'number' },
    { key: 'longitude', label: 'Longitude', type: 'number' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white border border-[#c8eedc] rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c8eedc]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#dff5ea] border border-[#c8eedc] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#167a68]" />
            </div>
            <h2 className="text-slate-900 font-semibold">{isEdit ? 'Edit Hospital' : 'Add New Hospital'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-slate-900 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ key, label, type = 'text', required, colSpan }) => (
               <div key={key} className={colSpan === 2 ? 'col-span-2' : ''}>
                <label className="block text-slate-500 text-xs font-medium mb-1.5">{label}</label>
                <input
                  type={type}
                  required={required}
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#167a68] transition-colors"
                />
              </div>
            ))}
          </div>
          {!isEdit && (
            <p className="text-xs text-[#0b4d3c] mt-4 bg-[#dff5ea]/60 p-3 rounded-xl border border-[#c8eedc] leading-relaxed">
              💡 Beds, ambulances, and OPD queues start empty by default. After creating the hospital, use the <strong className="text-[#167a68]">Manage</strong> button on the hospital row to enter each ward and service details manually.
            </p>
          )}
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-sm font-medium transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Hospital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ hospital, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      toast.success('Hospital deleted');
      onClose();
    } catch {
      toast.error('Failed to delete hospital');
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
            <h2 className="text-slate-900 font-semibold">Delete Hospital</h2>
            <p className="text-slate-500 text-sm">This action is irreversible</p>
          </div>
        </div>
        <p className="text-slate-600 text-sm mb-6">
          Are you sure you want to delete <strong>{hospital.name}</strong>? All associated data will be removed.
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

export default function HospitalManagement() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { type: 'add' | 'edit' | 'delete', data? }

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllHospitals({ search });
      setHospitals(res.data ?? res ?? []);
    } catch {
      // Fallback mock data
      setHospitals([
        { id: 1, name: 'Bir Hospital', address: 'Kathmandu', phone: '01-4221119', total_beds: 500, available_beds: 87, ambulances_count: 6 },
        { id: 2, name: 'Patan Hospital', address: 'Lalitpur', phone: '01-5522266', total_beds: 380, available_beds: 42, ambulances_count: 4 },
        { id: 3, name: 'TUTH', address: 'Maharajgunj', phone: '01-4412303', total_beds: 950, available_beds: 203, ambulances_count: 10 },
        { id: 4, name: 'Grande Hospital', address: 'Tokha', phone: '01-5159266', total_beds: 300, available_beds: 15, ambulances_count: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  const handleSave = async (form) => {
    if (modal?.data?.id) {
      await updateHospital(modal.data.id, form);
    } else {
      await createHospital(form);
    }
    fetchHospitals();
  };

  const handleDelete = async () => {
    await deleteHospital(modal.data.id);
    fetchHospitals();
  };

  const filtered = hospitals.filter((h) =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Management</h1>
          <p className="text-slate-500 text-sm mt-1">{hospitals.length} hospitals registered</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Hospital
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search hospitals by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#167a68] transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#c8eedc] p-6">
        <HospitalTable
          hospitals={filtered}
          loading={loading}
          onEdit={(h) => setModal({ type: 'edit', data: h })}
          onDelete={(h) => setModal({ type: 'delete', data: h })}
        />
      </div>

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <HospitalModal
          hospital={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          hospital={modal.data}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </SuperAdminLayout>
  );
}
