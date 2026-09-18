import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useActiveHospital } from '../../hooks/useActiveHospital';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import OPDUpdateForm from '../../components/admin/OPDUpdateForm';
import { getOpdQueues, updateOpdQueue, createOpdQueue, deleteOpdQueue } from '../../services/adminService';
import { RefreshCw, Users, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageOPD() {
  const { hospitalId, currentHospital } = useActiveHospital();

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    department: '',
    current_token: 1,
    estimated_wait_mins: 15,
    crowd_level: 'low',
  });
  const [isAdding, setIsAdding] = useState(false);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const res = await getOpdQueues(hospitalId);
      setQueues(res?.queues || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load OPD queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [hospitalId]);

  const handleUpdateQueue = async (data) => {
    const res = await updateOpdQueue(hospitalId, data);
    const updated = res.queue;
    setQueues((prev) =>
      prev.map((q) => (q.department === data.department ? { ...q, ...updated } : q))
    );
  };

  const handleDeleteQueue = async (queueId, department) => {
    if (!window.confirm(`Remove the ${department} department queue?`)) return;
    try {
      await deleteOpdQueue(hospitalId, queueId);
      setQueues((prev) => prev.filter((q) => q.id !== queueId));
      toast.success(`${department} queue removed.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove queue.');
    }
  };

  const handleAddQueue = async (e) => {
    e.preventDefault();
    if (!addForm.department.trim()) {
      toast.error('Department name is required.');
      return;
    }
    setIsAdding(true);
    try {
      const res = await createOpdQueue(hospitalId, {
        ...addForm,
        department: addForm.department.trim(),
      });
      toast.success(`${addForm.department} department queue created!`);
      setShowAddForm(false);
      setAddForm({ department: '', current_token: 1, estimated_wait_mins: 15, crowd_level: 'low' });
      await fetchQueues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create OPD queue.');
    } finally {
      setIsAdding(false);
    }
  };

  const CROWD_LEVELS = [
    { value: 'low', label: 'Low', color: 'text-emerald-400' },
    { value: 'moderate', label: 'Moderate', color: 'text-amber-400' },
    { value: 'high', label: 'High', color: 'text-red-400' },
  ];

  return (
    <HospitalAdminLayout
      title="Outpatient Department (OPD) Queue"
      subtitle="Broadcast current token numbers, estimated wait durations, and crowd congestion"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Patients waiting in hall receive live token updates on mobile and public screens</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchQueues}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Queues
            </button>

            <button
              onClick={() => setShowAddForm((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddForm ? 'Cancel' : 'Add Department'}
            </button>
          </div>
        </div>

        {/* Add Department Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddQueue}
            className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Add New OPD Department</h3>
                <p className="text-xs text-slate-400">Create a live-tracked queue for a hospital department</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Starting Token</label>
                <input
                  type="number"
                  min="0"
                  value={addForm.current_token}
                  onChange={(e) => setAddForm({ ...addForm, current_token: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Est. Wait (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={addForm.estimated_wait_mins}
                  onChange={(e) => setAddForm({ ...addForm, estimated_wait_mins: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Crowd Level</label>
                <select
                  value={addForm.crowd_level}
                  onChange={(e) => setAddForm({ ...addForm, crowd_level: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {CROWD_LEVELS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isAdding}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isAdding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isAdding ? 'Creating...' : 'Create Queue'}
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

        {/* Empty state — no departments yet */}
        {!loading && queues.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900 border border-dashed border-slate-700 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No OPD Departments Yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              No outpatient queues are configured. Add your first department (e.g., General Medicine, Cardiology) to start tracking live patient tokens.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors shadow-lg shadow-purple-950/50"
            >
              <Plus className="w-4 h-4" />
              Add Your First Department
            </button>
          </div>
        )}

        {queues.length > 0 && (
          <OPDUpdateForm
            queues={queues}
            onUpdateQueue={handleUpdateQueue}
            onDeleteQueue={handleDeleteQueue}
          />
        )}
      </div>
    </HospitalAdminLayout>
  );
}
