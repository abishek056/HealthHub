import React, { useState } from 'react';
import { BedDouble, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BedUpdateForm({ beds = [], onUpdateBed, onDeleteBed, loading }) {
  // Local edit state per bed row: { [bedId]: { available_beds, total_beds, saving } }
  const [editState, setEditState] = useState({});
  const [savingId, setSavingId] = useState(null);

  const getRowState = (bed) => {
    return editState[bed.id] || {
      available_beds: bed.available_beds,
      total_beds: bed.total_beds,
    };
  };

  const handleInputChange = (bedId, field, val, maxVal) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const validNum = maxVal !== undefined ? Math.min(num, maxVal) : num;

    setEditState((prev) => ({
      ...prev,
      [bedId]: {
        ...(prev[bedId] || {}),
        [field]: validNum,
      },
    }));
  };

  const handleSave = async (bed) => {
    const state = getRowState(bed);
    if (state.available_beds > state.total_beds) {
      toast.error('Available beds cannot exceed total beds.');
      return;
    }

    setSavingId(bed.id);
    try {
      await onUpdateBed(bed.id, {
        available_beds: state.available_beds,
        total_beds: state.total_beds,
      });
      toast.success(`${bed.ward_type} bed availability updated!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update bed count.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Hospital Wards Capacity</h3>
            <p className="text-xs text-slate-400">Directly adjust available beds for immediate public synchronization</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80">
            <tr>
              <th className="px-5 py-3.5">Ward Type</th>
              <th className="px-5 py-3.5">Available Beds</th>
              <th className="px-5 py-3.5">Total Beds</th>
              <th className="px-5 py-3.5">Occupancy</th>
              <th className="px-5 py-3.5">Last Updated</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {beds.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                  No ward bed data found for this hospital.
                </td>
              </tr>
            ) : (
              beds.map((bed) => {
                const current = getRowState(bed);
                const isSaving = savingId === bed.id;
                const hasChanged =
                  current.available_beds !== bed.available_beds ||
                  current.total_beds !== bed.total_beds;
                const occupancyRate =
                  current.total_beds > 0
                    ? Math.round(((current.total_beds - current.available_beds) / current.total_beds) * 100)
                    : 0;

                return (
                  <tr key={bed.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          bed.ward_type === 'ICU'
                            ? 'bg-red-500'
                            : bed.ward_type === 'Emergency'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {bed.ward_type} Ward
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange(bed.id, 'available_beds', current.available_beds - 1, current.total_beds)
                          }
                          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm disabled:opacity-30"
                          disabled={current.available_beds <= 0 || isSaving}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={current.total_beds}
                          value={current.available_beds}
                          onChange={(e) =>
                            handleInputChange(bed.id, 'available_beds', e.target.value, current.total_beds)
                          }
                          className="w-16 text-center font-bold text-emerald-400 bg-slate-950 border border-slate-700 rounded-lg py-1 text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange(bed.id, 'available_beds', current.available_beds + 1, current.total_beds)
                          }
                          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm disabled:opacity-30"
                          disabled={current.available_beds >= current.total_beds || isSaving}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="1"
                        value={current.total_beds}
                        onChange={(e) => handleInputChange(bed.id, 'total_beds', e.target.value)}
                        className="w-16 text-center font-semibold text-white bg-slate-950 border border-slate-700 rounded-lg py-1 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className={occupancyRate >= 90 ? 'text-red-400' : 'text-slate-400'}>
                            {occupancyRate}%
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {current.total_beds - current.available_beds}/{current.total_beds}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              occupancyRate >= 90
                                ? 'bg-red-500'
                                : occupancyRate >= 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {bed.last_updated ? new Date(bed.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(bed)}
                          disabled={isSaving || !hasChanged}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            hasChanged
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/60'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Save
                            </>
                          )}
                        </button>
                        {onDeleteBed && (
                          <button
                            onClick={() => onDeleteBed(bed.id, bed.ward_type)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all"
                            title="Delete Ward"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
