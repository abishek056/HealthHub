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
  AlertTriangle,
  Eye,
  Stethoscope,
  Clock,
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
  const [viewingRecord, setViewingRecord] = useState(null);
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
    if (!formData.patient_name || formData.age === '' || formData.age === undefined) {
      toast.error('Patient Name and Age are required.');
      return;
    }

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 100) {
      toast.error('Patient age must be between 0 and 100 years.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#c8eedc] p-4 rounded-2xl shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or diagnosis..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#167a68]"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Patient Record
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-white border border-[#c8eedc] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-[#fbfdfc] text-xs uppercase text-slate-500 font-semibold border-b border-emerald-100">
              <tr>
                <th className="px-5 py-3.5">Patient Info</th>
                <th className="px-5 py-3.5">Age & Gender</th>
                <th className="px-5 py-3.5">Contact Phone</th>
                <th className="px-5 py-3.5">Diagnosis</th>
                <th className="px-5 py-3.5">Admission / Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
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
                  <tr key={rec.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#dff5ea] border border-[#c8eedc] flex items-center justify-center text-[#167a68] font-bold text-xs shrink-0">
                          {rec.patient_name ? rec.patient_name[0].toUpperCase() : 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{rec.patient_name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">Record #{rec.id}</span>
                            {rec.appointment?.token_number && (
                              <span className="text-[10px] font-mono font-bold bg-[#dff5ea] border border-[#c2ebd5] text-[#0b4d3c] px-1.5 py-0.5 rounded">
                                {rec.appointment.token_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <span className="font-bold text-slate-800">{rec.age} yrs</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="capitalize text-slate-500">{rec.gender}</span>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-slate-600">
                      {rec.phone || '—'}
                    </td>

                    <td className="px-5 py-4 text-xs max-w-xs text-slate-600">
                      <div className="space-y-0.5">
                        {rec.appointment?.department && (
                          <span className="inline-block text-[10px] font-semibold text-[#167a68] bg-emerald-50 border border-[#c8eedc] px-1.5 py-0.5 rounded">
                            {rec.appointment.department} OPD
                          </span>
                        )}
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {rec.diagnosis || 'General Checkup'}
                        </p>
                        {rec.treatment && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{rec.treatment}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingRecord(rec)}
                          className="p-1.5 text-slate-500 hover:text-[#167a68] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(rec)}
                          className="p-1.5 text-slate-500 hover:text-[#167a68] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          disabled={deletingId === rec.id}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="px-5 py-3.5 border-t border-[#c8eedc] flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {pagination.from || 1} to {pagination.to || records.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => onPageChange(pagination.current_page - 1)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-slate-700 font-medium transition-colors"
              >
                Prev
              </button>
              <span className="px-2 font-bold text-slate-900">{pagination.current_page}</span>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => onPageChange(pagination.current_page + 1)}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-slate-700 font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Record Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#c8eedc] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#c8eedc] flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {editingRecord ? 'Edit Patient Record' : 'New Patient Record'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Thapa"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    placeholder="35"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9800000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Problem Diagnosis & Clinical Findings <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Enter medical problem diagnosis (e.g. Acute viral bronchitis, Type 2 Diabetes, Hypertension, Fracture)..."
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Prescribed Treatment / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Enter treatment plan, prescribed medications..."
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#c8eedc]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingRecord ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Record Details Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#c8eedc] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#c8eedc] flex items-center justify-between bg-[#fbfdfc]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#dff5ea] border border-[#c2ebd5] flex items-center justify-center text-[#167a68]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Patient Medical Record #{viewingRecord.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {viewingRecord.created_at
                      ? new Date(viewingRecord.created_at).toLocaleString()
                      : 'Hospital Visit'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Patient Demographics Card */}
              <div className="p-3.5 bg-[#fbfdfc] border border-emerald-100 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{viewingRecord.patient_name}</h4>
                  <div className="flex items-center gap-2 text-slate-600 text-xs mt-0.5">
                    <span>{viewingRecord.age} yrs</span>
                    <span>•</span>
                    <span className="capitalize">{viewingRecord.gender}</span>
                    {viewingRecord.phone && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{viewingRecord.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#167a68]/10 text-[#167a68] font-bold flex items-center justify-center text-sm">
                  {viewingRecord.patient_name ? viewingRecord.patient_name[0].toUpperCase() : 'P'}
                </div>
              </div>

              {/* Linked Appointment Details (if any) */}
              {viewingRecord.appointment && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b4d3c] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#167a68]" /> Linked OPD Appointment
                    </span>
                    <span className="font-mono font-bold text-[11px] text-[#0b4d3c] bg-[#dff5ea] border border-[#c2ebd5] px-2 py-0.5 rounded">
                      Token: {viewingRecord.appointment.token_number}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <p className="font-bold text-slate-800">{viewingRecord.appointment.department}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Assigned Doctor:</span>
                      <p className="font-medium text-slate-800">
                        {viewingRecord.appointment.doctor_name
                          ? `Dr. ${viewingRecord.appointment.doctor_name}`
                          : 'General Consultant'}
                      </p>
                    </div>
                    {viewingRecord.appointment.appointment_date && (
                      <div>
                        <span className="text-slate-500">Visit Date:</span>
                        <p className="font-medium text-slate-800">
                          {viewingRecord.appointment.appointment_date}
                        </p>
                      </div>
                    )}
                    {viewingRecord.appointment.time_slot && (
                      <div>
                        <span className="text-slate-500">Time Slot:</span>
                        <p className="font-medium text-slate-800">
                          {viewingRecord.appointment.time_slot}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-[#167a68]" /> Problem Diagnosis & Clinical Findings
                </label>
                <div className="p-3 rounded-xl bg-[#fbfdfc] border border-emerald-100 text-slate-900 font-semibold leading-relaxed">
                  {viewingRecord.diagnosis || 'General Checkup'}
                </div>
              </div>

              {/* Treatment */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Prescribed Treatment & Clinical Advice
                </label>
                <div className="p-3 rounded-xl bg-[#fbfdfc] border border-emerald-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewingRecord.treatment || 'No specific treatment prescribed.'}
                </div>
              </div>

              {/* Attending Creator Info */}
              {viewingRecord.creator && (
                <p className="text-[11px] text-slate-400">
                  Recorded by: <span className="text-slate-600 font-medium">{viewingRecord.creator.name}</span>
                </p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#c8eedc] bg-[#fbfdfc] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const name = viewingRecord.patient_name;
                  setViewingRecord(null);
                  onSearchChange(name);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0b4d3c] text-xs font-semibold transition-colors border border-emerald-200"
              >
                View all visits for this patient
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rec = viewingRecord;
                    setViewingRecord(null);
                    openEditModal(rec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#c8eedc] text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#167a68] hover:bg-[#116253] text-white text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
