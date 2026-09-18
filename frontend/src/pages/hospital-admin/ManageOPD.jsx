import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import OPDUpdateForm from '../../components/admin/OPDUpdateForm';
import { getOpdQueues, updateOpdQueue } from '../../services/adminService';
import { RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageOPD() {
  const { user } = useAuth();
  const hospitalId = user?.hospital_id || 1;

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

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

          <button
            onClick={fetchQueues}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queues
          </button>
        </div>

        <OPDUpdateForm
          queues={queues}
          onUpdateQueue={handleUpdateQueue}
        />
      </div>
    </HospitalAdminLayout>
  );
}
