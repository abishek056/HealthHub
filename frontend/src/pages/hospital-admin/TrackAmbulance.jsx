import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import AmbulanceTracker from '../../components/admin/AmbulanceTracker';
import { getHospitalDetails, getAmbulances, updateAmbulanceLocation } from '../../services/adminService';
import { RefreshCw, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrackAmbulance() {
  const { user } = useAuth();
  const hospitalId = user?.hospital_id || 1;

  const [ambulances, setAmbulances] = useState([]);
  const [hospitalCoords, setHospitalCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAmbulanceData = async () => {
    setLoading(true);
    try {
      const [hosp, ambList] = await Promise.all([
        getHospitalDetails(hospitalId),
        getAmbulances(hospitalId),
      ]);

      if (hosp?.latitude && hosp?.longitude) {
        setHospitalCoords({ latitude: hosp.latitude, longitude: hosp.longitude });
      }

      setAmbulances(Array.isArray(ambList) ? ambList : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ambulance fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulanceData();
  }, [hospitalId]);

  const handleUpdateLocation = async (ambulanceId, data) => {
    const res = await updateAmbulanceLocation(hospitalId, ambulanceId, data);
    const updated = res.ambulance;

    setAmbulances((prev) =>
      prev.map((a) => (a.id === ambulanceId ? { ...a, ...updated } : a))
    );
  };

  return (
    <HospitalAdminLayout
      title="Ambulance Fleet GPS Tracking"
      subtitle="Dispatch and update real-time coordinates for hospital emergency vehicles"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Updates are pushed live over WebSockets to public map trackers</span>
          </div>

          <button
            onClick={fetchAmbulanceData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Fleet
          </button>
        </div>

        <AmbulanceTracker
          ambulances={ambulances}
          hospitalCoords={hospitalCoords}
          onUpdateLocation={handleUpdateLocation}
        />
      </div>
    </HospitalAdminLayout>
  );
}
