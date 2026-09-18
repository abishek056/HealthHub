import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import BedUpdateForm from '../../components/admin/BedUpdateForm';
import { getBeds, updateBed, createBed, deleteBed } from '../../services/adminService';
import { RefreshCw, BedDouble, Plus, X, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const WARD_TYPES = ['ICU', 'Emergency', 'General', 'Private'];
const WARD_COLORS = {
  ICU: 'text-red-400 bg-red-500/10 border-red-500/30',
  Emergency: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  General: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Private: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

export default function ManageBeds() {
  const { user } = useAuth();
  const hospitalId = user?.hospital_id || 1;

  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ ward_type: 'General', total_beds: 20, available_beds: 15 });
  const [isAdding, setIsAdding] = useState(false);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const res = await getBeds(hospitalId);
      const wardsList = res.wards || [];
      setBeds(wardsList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hospital ward beds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [hospitalId]);

  const handleUpdateBed = async (bedId, data) => {
    const updated = await updateBed(hospitalId, bedId, data);
    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, ...updated.bed } : b))
    );
  };

  const handleDeleteBed = async (bedId, wardType) => {
    if (!window.confirm(`Remove the ${wardType} ward from this hospital?`)) return;
    try {
      await deleteBed(hospitalId, bedId);
      setBeds((prev) => prev.filter((b) => b.id !== bedId));
      toast.success(`${wardType} ward removed.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove ward.');
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    if (addForm.available_beds > addForm.total_beds) {
      toast.error('Available beds cannot exceed total beds.');
      return;
    }
    setIsAdding(true);
    try {
      const res = await createBed(hospitalId, addForm);
      toast.success(`${addForm.ward_type} ward added successfully!`);
      setShowAddForm(false);
      setAddForm({ ward_type: 'General', total_beds: 20, available_beds: 15 });
      await fetchBeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add ward.');
    } finally {
      setIsAdding(false);
    }
  };

  const existingWardTypes = beds.map((b) => b.ward_type);
  const availableWardTypes = WARD_TYPES.filter((w) => !existingWardTypes.includes(w));

  return (
    <HospitalAdminLayout
      title="Manage Ward Beds"
      subtitle="Update real-time available beds across ICU, Emergency, General, and Private wards"
    >
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BedDouble className="w-4 h-4 text-emerald-400" />
            <span>Changes broadcast instantly to the public emergency routing engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBeds}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {availableWardTypes.length > 0 && (
              <button
                onClick={() => setShowAddForm((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddForm ? 'Cancel' : 'Add Ward'}
              </button>
            )}
          </div>
        </div>

        {/* Add Ward Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddBed}
            className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Add New Ward</h3>
                <p className="text-xs text-slate-400">Configure a new ward bed type for this hospital</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ward Type</label>
                <select
                  value={addForm.ward_type}
                  onChange={(e) => setAddForm({ ...addForm, ward_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {availableWardTypes.map((w) => (
                    <option key={w} value={w}>{w} Ward</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Total Beds</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addForm.total_beds}
                  onChange={(e) => setAddForm({ ...addForm, total_beds: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Available Beds</label>
                <input
                  type="number"
                  min="0"
                  max={addForm.total_beds}
                  required
                  value={addForm.available_beds}
                  onChange={(e) => setAddForm({ ...addForm, available_beds: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Ward preview pill */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${WARD_COLORS[addForm.ward_type] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                <BedDouble className="w-3 h-3" />
                {addForm.ward_type} Ward · {addForm.available_beds}/{addForm.total_beds} available
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isAdding}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isAdding ? 'Adding Ward...' : 'Add Ward'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* All 4 wards exist notice */}
        {availableWardTypes.length === 0 && !showAddForm && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
            <Check className="w-4 h-4" />
            All ward types (ICU, Emergency, General, Private) are configured for this hospital.
          </div>
        )}

        {/* Empty state — no wards yet */}
        {!loading && beds.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <BedDouble className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No Wards Configured Yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              This hospital has no ward beds set up. Add your ICU, Emergency, General, or Private wards to enable real-time bed tracking.
            </p>
            {availableWardTypes.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-950/50"
              >
                <Plus className="w-4 h-4" />
                Add Your First Ward
              </button>
            )}
          </div>
        )}

        {beds.length > 0 && (
          <BedUpdateForm
            beds={beds}
            onUpdateBed={handleUpdateBed}
            onDeleteBed={handleDeleteBed}
            loading={loading}
          />
        )}
      </div>
    </HospitalAdminLayout>
  );
}
