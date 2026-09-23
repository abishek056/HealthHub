import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useActiveHospital } from '../../hooks/useActiveHospital';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import AmbulanceTracker from '../../components/admin/AmbulanceTracker';
import AddAmbulanceForm from '../../components/admin/AddAmbulanceForm';
import {
  getHospitalDetails,
  getAmbulances,
  updateAmbulanceLocation,
  createAmbulance,
  deleteAmbulance,
} from '../../services/adminService';
import { RefreshCw, Radio, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TrackAmbulance() {
  const { hospitalId, currentHospital } = useActiveHospital();

  const [ambulances, setAmbulances] = useState([]);
  const [hospitalCoords, setHospitalCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddAmbulance = async (formData) => {
    const res = await createAmbulance(hospitalId, formData);
    setAmbulances((prev) => [...prev, res.ambulance]);
    setShowAddForm(false);
    toast.success(`${formData.vehicle_number} added to fleet!`);
  };

  const handleDeleteAmbulance = async (ambulanceId, vehicleNumber) => {
    if (!window.confirm(`Remove ${vehicleNumber || 'this ambulance'} from the fleet?`)) return;
    try {
      await deleteAmbulance(hospitalId, ambulanceId);
      setAmbulances((prev) => prev.filter((a) => a.id !== ambulanceId));
      toast.success('Ambulance removed from fleet.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove ambulance.');
    }
  };

  return (
    <HospitalAdminLayout
      title="Ambulance Fleet GPS Tracking"
      subtitle="Dispatch and update real-time coordinates for hospital emergency vehicles"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Radio className="w-4 h-4 text-[#167a68] animate-pulse" />
            <span>Updates are pushed live over WebSockets to public map trackers</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAmbulanceData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#c8eedc] text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Fleet
            </button>

            <button
              onClick={() => setShowAddForm((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#167a68] hover:bg-[#116253] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddForm ? 'Cancel' : 'Add Ambulance'}
            </button>
          </div>
        </div>

        {/* Add ambulance slide-in form */}
        {showAddForm && (
          <AddAmbulanceForm
            hospitalCoords={hospitalCoords}
            onAdd={handleAddAmbulance}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Empty state — no ambulances yet */}
        {!loading && ambulances.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-[#c8eedc] rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#dff5ea] border border-[#c8eedc] flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-[#167a68]" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">No Ambulances in Fleet</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6">
              This hospital has no ambulances registered. Add your first vehicle with driver details and GPS coordinates to enable live tracking.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Your First Ambulance
            </button>
          </div>
        )}

        {ambulances.length > 0 && (
          <AmbulanceTracker
            ambulances={ambulances}
            hospitalCoords={hospitalCoords}
            onUpdateLocation={handleUpdateLocation}
            onDeleteAmbulance={handleDeleteAmbulance}
          />
        )}
      </div>
    </HospitalAdminLayout>
  );
}
