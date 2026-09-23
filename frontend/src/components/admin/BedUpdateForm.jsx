import React, { useState } from 'react';
import { BedDouble, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BedUpdateForm({ beds = [], onUpdateBed, onDeleteBed, loading }) {
  // Local edit state per bed row: { [bedId]: { available_beds, total_beds } }
  const [editState, setEditState] = useState({});
  const [savingId, setSavingId] = useState(null);

  const getRowState = (bed) => {
    const existing = editState[bed.id];
    return {
      available_beds:
        existing?.available_beds !== undefined
          ? Number(existing.available_beds)
          : Number(bed.available_beds) || 0,
      total_beds:
        existing?.total_beds !== undefined
          ? Number(existing.total_beds)
          : Number(bed.total_beds) || 0,
    };
  };

  const handleInputChange = (bed, field, val, maxVal) => {
    const current = getRowState(bed);
    const parsed = parseInt(val, 10);
    const num = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const validNum = maxVal !== undefined && !isNaN(maxVal) ? Math.min(num, maxVal) : num;

    const next = {
      available_beds: current.available_beds,
      total_beds: current.total_beds,
      [field]: validNum,
    };

    // If total_beds is decreased below available_beds, adjust available_beds
    if (field === 'total_beds' && next.available_beds > validNum) {
      next.available_beds = validNum;
    }

    setEditState((prev) => ({
      ...prev,
      [bed.id]: next,
    }));
  };

  const handleStepAvailable = (bed, delta) => {
    const current = getRowState(bed);
    let newAvail = current.available_beds + delta;
    let newTotal = current.total_beds;

    if (newAvail < 0) newAvail = 0;
    // If adding available bed beyond total, automatically bump total beds
    if (newAvail > newTotal) {
      newTotal = newAvail;
    }

    setEditState((prev) => ({
      ...prev,
      [bed.id]: {
        available_beds: newAvail,
        total_beds: newTotal,
      },
    }));
  };

  const handleStepTotal = (bed, delta) => {
    const current = getRowState(bed);
    let newTotal = Math.max(1, current.total_beds + delta);
    let newAvail = current.available_beds;

    if (newAvail > newTotal) {
      newAvail = newTotal;
    }

    setEditState((prev) => ({
      ...prev,
      [bed.id]: {
        available_beds: newAvail,
        total_beds: newTotal,
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
    <div className="bg-white border border-[#c8eedc] rounded-2xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-[#c8eedc] bg-[#fbfdfc] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#c8eedc] text-[#167a68] flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Hospital Wards Capacity</h3>
            <p className="text-xs text-slate-500">
              Adjust available and total beds with live public broadcast synchronization
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-[#fbfdfc] text-xs uppercase text-slate-500 font-semibold border-b border-[#c8eedc]">
            <tr>
              <th className="px-5 py-3.5">Ward Type</th>
              <th className="px-5 py-3.5">Available Beds</th>
              <th className="px-5 py-3.5">Total Beds</th>
              <th className="px-5 py-3.5">Occupancy</th>
              <th className="px-5 py-3.5">Last Updated</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dff5ea]">
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
                  current.available_beds !== Number(bed.available_beds) ||
                  current.total_beds !== Number(bed.total_beds);
                const occupancyRate =
                  current.total_beds > 0
                    ? Math.round(
                        ((current.total_beds - current.available_beds) / current.total_beds) * 100
                      )
                    : 0;

                return (
                  <tr key={bed.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          bed.ward_type === 'ICU'
                            ? 'bg-rose-500'
                            : bed.ward_type === 'Emergency'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {bed.ward_type} Ward
                    </td>

                    {/* Available Beds Stepper */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStepAvailable(bed, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm disabled:opacity-30 cursor-pointer transition-colors"
                          disabled={current.available_beds <= 0 || isSaving}
                          title="Decrease available beds"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={current.available_beds}
                          onChange={(e) =>
                            handleInputChange(bed, 'available_beds', e.target.value)
                          }
                          className="w-16 text-center font-bold text-[#167a68] bg-[#fbfdfc] border border-[#c8eedc] rounded-lg py-1 text-sm focus:outline-none focus:border-[#167a68]"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepAvailable(bed, 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm disabled:opacity-30 cursor-pointer transition-colors"
                          disabled={isSaving}
                          title="Increase available beds"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Total Beds Stepper */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStepTotal(bed, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm disabled:opacity-30 cursor-pointer transition-colors"
                          disabled={current.total_beds <= 1 || isSaving}
                          title="Decrease total ward beds"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={current.total_beds}
                          onChange={(e) => handleInputChange(bed, 'total_beds', e.target.value)}
                          className="w-16 text-center font-bold text-slate-900 bg-[#fbfdfc] border border-[#c8eedc] rounded-lg py-1 text-sm focus:outline-none focus:border-[#167a68]"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepTotal(bed, 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm disabled:opacity-30 cursor-pointer transition-colors"
                          disabled={isSaving}
                          title="Increase total ward beds"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Occupancy Indicator */}
                    <td className="px-5 py-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span
                            className={
                              occupancyRate >= 90
                                ? 'text-rose-600'
                                : occupancyRate >= 70
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }
                          >
                            {occupancyRate}%
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {Math.max(0, current.total_beds - current.available_beds)}/
                            {current.total_beds}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-[#c8eedc]/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              occupancyRate >= 90
                                ? 'bg-rose-500'
                                : occupancyRate >= 70
                                ? 'bg-amber-500'
                                : 'bg-[#167a68]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {bed.last_updated
                        ? new Date(bed.last_updated).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recently'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(bed)}
                          disabled={isSaving || !hasChanged}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            hasChanged
                              ? 'bg-[#167a68] hover:bg-[#116253] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
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
