import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import BedUpdateForm from '../../components/admin/BedUpdateForm';
import { getBeds, updateBed } from '../../services/adminService';
import { RefreshCw, BedDouble, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageBeds() {
  const { user } = useAuth();
  const hospitalId = user?.hospital_id || 1;

  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // Refresh local list state with the updated record
    setBeds((prev) =>
      prev.map((b) => (b.id === bedId ? { ...b, ...updated.bed } : b))
    );
  };

  return (
    <HospitalAdminLayout
      title="Manage Ward Beds"
      subtitle="Update real-time available beds across ICU, Emergency, General, and Private wards"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BedDouble className="w-4 h-4 text-emerald-400" />
            <span>Changes broadcast instantly to the public emergency routing engine</span>
          </div>

          <button
            onClick={fetchBeds}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <BedUpdateForm
          beds={beds}
          onUpdateBed={handleUpdateBed}
          loading={loading}
        />
      </div>
    </HospitalAdminLayout>
  );
}
