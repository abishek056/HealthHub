import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  FileText,
  X,
  Check,
  RefreshCw,
  User,
  Phone,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientTable({
  records = [],
  pagination,
  searchQuery,
  onSearchChange,
  onPageChange,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord,
  loading,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    patient_name: '',
    age: '',
    gender: 'male',
    phone: '',
    diagnosis: '',
    treatment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormData({
      patient_name: '',
      age: '',
      gender: 'male',
      phone: '',
      diagnosis: '',
      treatment: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (rec) => {
    setEditingRecord(rec);
    setFormData({
      patient_name: rec.patient_name || '',
      age: rec.age || '',
      gender: rec.gender || 'male',
      phone: rec.phone || '',
      diagnosis: rec.diagnosis || '',
      treatment: rec.treatment || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_name || !formData.age) {
      toast.error('Patient Name and Age are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await onUpdateRecord(editingRecord.id, formData);
        toast.success('Patient record updated successfully.');
      } else {
        await onCreateRecord(formData);
        toast.success('New patient record created successfully.');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save patient record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this patient record?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDeleteRecord(id);
      toast.success('Patient record deleted.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or diagnosis..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Patient Record
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80">
              <tr>
                <th className="px-5 py-3.5">Patient Info</th>
                <th className="px-5 py-3.5">Age & Gender</th>
                <th className="px-5 py-3.5">Contact Phone</th>
                <th className="px-5 py-3.5">Diagnosis</th>
                <th className="px-5 py-3.5">Admission / Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      Loading patient records...
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    No patient records found matching your search.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                          {rec.patient_name ? rec.patient_name[0].toUpperCase() : 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{rec.patient_name}</p>
                          <p className="text-[11px] text-slate-400">Record #{rec.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <span className="font-bold text-slate-200">{rec.age} yrs</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="capitalize text-slate-400">{rec.gender}</span>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-slate-300">
                      {rec.phone || '—'}
                    </td>

                    <td className="px-5 py-4 text-xs max-w-xs truncate text-slate-300">
                      <span className="font-semibold text-slate-200">{rec.diagnosis || 'General Checkup'}</span>
                      {rec.treatment && (
                        <p className="text-[11px] text-slate-500 truncate">{rec.treatment}</p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(rec)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          disabled={deletingId === rec.id}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.total > pagination.per_page && (
          <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {pagination.from || 1} to {pagination.to || records.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => onPageChange(pagination.current_page - 1)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
              >
                Prev
              </button>
              <span className="px-2 font-bold text-white">{pagination.current_page}</span>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => onPageChange(pagination.current_page + 1)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Record Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingRecord ? 'Edit Patient Record' : 'New Patient Record'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Thapa"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    max="130"
                    required
                    placeholder="35"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9800000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Diagnosis</label>
                <textarea
                  rows="2"
                  placeholder="Enter medical diagnosis or symptoms..."
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Prescribed Treatment / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Enter treatment plan, prescribed medications..."
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingRecord ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
