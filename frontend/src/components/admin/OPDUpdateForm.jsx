import React, { useState } from 'react';
import { Users, UserPlus, Check, RefreshCw, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OPDUpdateForm({ queues = [], onUpdateQueue, onDeleteQueue }) {
  const [editState, setEditState] = useState({});
  const [updatingDept, setUpdatingDept] = useState(null);

  const getRowState = (q) => {
    return (
      editState[q.department] || {
        current_token: q.current_token ?? 0,
        estimated_wait_mins: q.estimated_wait_mins ?? 15,
        crowd_level: q.crowd_level ?? 'medium',
      }
    );
  };

  const handleChange = (department, field, val) => {
    setEditState((prev) => ({
      ...prev,
      [department]: {
        ...(prev[department] || {}),
        [field]: val,
      },
    }));
  };

  const handleSave = async (department) => {
    const currentQ = queues.find((q) => q.department === department);
    const row = getRowState(currentQ || { department, current_token: 0, estimated_wait_mins: 15, crowd_level: 'medium' });

    setUpdatingDept(department);
    try {
      await onUpdateQueue({
        department,
        current_token: parseInt(row.current_token, 10) || 0,
        estimated_wait_mins: parseInt(row.estimated_wait_mins, 10) || 0,
        crowd_level: row.crowd_level,
      });
      toast.success(`${department} queue updated!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update OPD queue.');
    } finally {
      setUpdatingDept(null);
    }
  };

  // Quick action: Call next patient (token + 1)
  const handleCallNext = async (q) => {
    const current = getRowState(q);
    const nextToken = current.current_token + 1;
    handleChange(q.department, 'current_token', nextToken);

    setUpdatingDept(q.department);
    try {
      await onUpdateQueue({
        department: q.department,
        current_token: nextToken,
        estimated_wait_mins: current.estimated_wait_mins,
        crowd_level: current.crowd_level,
      });
      toast.success(`Called Token #${nextToken} for ${q.department}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to call next token.');
    } finally {
      setUpdatingDept(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">OPD Queue Dispatcher</h3>
            <p className="text-xs text-slate-400">Advance tokens and broadcast live wait times to waiting patients</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80">
            <tr>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Current Token</th>
              <th className="px-5 py-3.5">Est. Wait Time</th>
              <th className="px-5 py-3.5">Crowd Level</th>
              <th className="px-5 py-3.5">Call Next</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {queues.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                  No OPD queues active for this hospital.
                </td>
              </tr>
            ) : (
              queues.map((q) => {
                const current = getRowState(q);
                const isUpdating = updatingDept === q.department;

                return (
                  <tr key={q.id || q.department} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      {q.department}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              q.department,
                              'current_token',
                              Math.max(0, current.current_token - 1)
                            )
                          }
                          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm disabled:opacity-30"
                          disabled={current.current_token <= 0 || isUpdating}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={current.current_token}
                          onChange={(e) =>
                            handleChange(
                              q.department,
                              'current_token',
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          className="w-16 text-center font-black text-purple-400 bg-slate-950 border border-slate-700 rounded-lg py-1 text-sm focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              q.department,
                              'current_token',
                              current.current_token + 1
                            )
                          }
                          className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm"
                          disabled={isUpdating}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={current.estimated_wait_mins}
                          onChange={(e) =>
                            handleChange(
                              q.department,
                              'estimated_wait_mins',
                              Math.max(0, parseInt(e.target.value, 10) || 0)
                            )
                          }
                          className="w-16 text-center font-bold text-white bg-slate-950 border border-slate-700 rounded-lg py-1 text-sm focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-slate-400">mins</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={current.crowd_level}
                        onChange={(e) => handleChange(q.department, 'crowd_level', e.target.value)}
                        className={`bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none ${
                          current.crowd_level === 'high'
                            ? 'text-red-400'
                            : current.crowd_level === 'medium'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        <option value="low">Low Crowd</option>
                        <option value="medium">Medium Crowd</option>
                        <option value="high">High Crowd</option>
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleCallNext(q)}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Call Next (+1)
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(q.department)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Update
                        </button>
                        {onDeleteQueue && (
                          <button
                            onClick={() => onDeleteQueue(q.id, q.department)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all"
                            title="Remove department"
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
