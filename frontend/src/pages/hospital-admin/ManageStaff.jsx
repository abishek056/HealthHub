import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import {
  getHospitalStaff,
  createHospitalStaff,
  updateHospitalStaff,
  deleteHospitalStaff,
} from '../../services/adminService';
import {
  UserPlus,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Mail,
  Phone,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useActiveHospital } from '../../hooks/useActiveHospital';

export default function ManageStaff() {
  const { user } = useAuth();
  const { hospitalId, currentHospital } = useActiveHospital();

  // hospital_staff users can only manage other hospital_staff (not hospital_admin)
  const isActingStaff = user?.role === 'hospital_staff';

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('hospital_staff');

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHospitalStaff(hospitalId, { search });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setStaffList(list);
    } catch (err) {
      console.warn('Failed to load hospital staff:', err);
      // Fallback mock list if needed
      setStaffList([
        {
          id: 1,
          name: 'Nurse Sunita KC',
          email: 'sunita.kc@birhospital.com',
          phone: '9841887766',
          role: 'hospital_staff',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Dr. Suresh Thapa',
          email: 'suresh@birhospital.com',
          phone: '9851022334',
          role: 'hospital_admin',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, search]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormRole('hospital_staff');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormName(staff.name || '');
    setFormEmail(staff.email || '');
    setFormPassword('');
    setFormPhone(staff.phone || '');
    setFormRole(staff.role || 'hospital_staff');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }

    if (!editingStaff && !formPassword) {
      toast.error('Password is required for new staff');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formName,
        email: formEmail,
        phone: formPhone || undefined,
        role: formRole,
      };

      if (formPassword) {
        payload.password = formPassword;
      }

      if (editingStaff) {
        await updateHospitalStaff(hospitalId, editingStaff.id, payload);
        toast.success('Staff member updated successfully');
      } else {
        await createHospitalStaff(hospitalId, payload);
        toast.success('New hospital staff created successfully!');
      }

      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error('Staff save failed:', err);
      toast.error(err.response?.data?.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId, staffName, staffRole) => {
    if (user?.id === staffId) {
      toast.error('You cannot delete your own account.');
      return;
    }

    // hospital_staff cannot delete hospital_admin accounts
    if (isActingStaff && staffRole === 'hospital_admin') {
      toast.error('You do not have permission to remove administrator accounts.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${staffName} from this hospital?`)) {
      return;
    }

    try {
      await deleteHospitalStaff(hospitalId, staffId);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (err) {
      console.error('Failed to delete staff:', err);
      toast.error(err.response?.data?.message || 'Failed to remove staff member');
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <HospitalAdminLayout
      title="Hospital Staff Management"
      subtitle={`Manage medical personnel, operators, and staff members for Hospital #${hospitalId}`}
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#c8eedc] p-4 rounded-2xl shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#167a68] transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStaff}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#fbfdfc] hover:bg-emerald-50 text-[#167a68] transition-colors border border-[#c8eedc]"
              title="Refresh Staff List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white font-semibold text-sm flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Hospital Staff
            </button>
          </div>
        </div>

        {/* Staff Table / List Card */}
        <div className="bg-white border border-[#c8eedc] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-emerald-50/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <Users className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-slate-700 font-medium">No hospital staff found</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                {search
                  ? 'No personnel matches your search filter.'
                  : 'Start adding nurses, doctors, receptionists, or staff to grant them access to this hospital.'}
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Add First Staff Member
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-[#fbfdfc] border-b border-[#c8eedc] text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3.5 px-6">Staff Member</th>
                    <th className="py-3.5 px-6">Role & Privileges</th>
                    <th className="py-3.5 px-6">Contact Phone</th>
                    <th className="py-3.5 px-6">Date Added</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dff5ea]">
                  {filteredStaff.map((staff) => {
                    const isAdmin = staff.role === 'hospital_admin';
                    const isCurrentUser = user?.id === staff.id;

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-emerald-50/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#c8eedc] text-[#167a68] font-bold flex items-center justify-center text-sm">
                              {staff.name?.slice(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <div>
                              <p className="text-slate-900 font-semibold flex items-center gap-2">
                                {staff.name}
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-emerald-100 text-[#0b4d3c] font-bold px-1.5 py-0.5 rounded border border-[#c8eedc]">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {staff.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              isAdmin
                                ? 'bg-[#dff5ea] text-[#167a68] border-[#c8eedc]'
                                : 'bg-emerald-50 text-emerald-700 border-[#c8eedc]'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {isAdmin ? 'Hospital Admin' : 'Hospital Staff'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500">
                          {staff.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {staff.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500">
                          {staff.created_at
                            ? new Date(staff.created_at).toLocaleDateString()
                            : 'Active'}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              disabled={isActingStaff && isAdmin}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isActingStaff && isAdmin
                                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#167a68] cursor-pointer'
                              }`}
                              title={isActingStaff && isAdmin ? 'Staff cannot edit admin accounts' : 'Edit Staff details'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isCurrentUser && !(isActingStaff && isAdmin) && (
                              <button
                                onClick={() => handleDelete(staff.id, staff.name, staff.role)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                                title="Remove staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT STAFF MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white border border-[#c8eedc] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#c8eedc]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-[#c8eedc] text-[#167a68] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStaff ? 'Edit Staff Member' : 'Add Hospital Staff'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hospital #{hospitalId} access control
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nurse Sunita Sharma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="sunita@hospital.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {editingStaff ? 'New Password (leave empty to keep current)' : 'Login Password *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required={!editingStaff}
                    minLength={6}
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="9841000000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-[#fbfdfc] border border-[#c8eedc] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#167a68]"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Staff Role & Authority
                </label>
                {isActingStaff ? (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#167a68]" />
                      <span className="text-xs font-bold text-[#0b4d3c]">Hospital Staff</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      As a staff member, you can register and onboard peer Hospital Staff members for this facility.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormRole('hospital_staff')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formRole === 'hospital_staff'
                          ? 'bg-emerald-50 border-[#167a68] ring-1 ring-[#167a68] text-[#0b4d3c]'
                          : 'bg-[#fbfdfc] border-[#c8eedc] text-slate-600 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span className="block text-xs font-bold">Hospital Staff</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        Beds, OPD, Ambulance
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormRole('hospital_admin')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formRole === 'hospital_admin'
                          ? 'bg-[#dff5ea] border-[#167a68] ring-1 ring-[#167a68] text-[#0b4d3c]'
                          : 'bg-[#fbfdfc] border-[#c8eedc] text-slate-600 hover:bg-[#dff5ea]/50'
                      }`}
                    >
                      <span className="block text-xs font-bold">Hospital Admin</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        Full hospital management
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#167a68] hover:bg-[#116253] text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving
                    ? 'Saving...'
                    : editingStaff
                    ? 'Save Changes'
                    : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HospitalAdminLayout>
  );
}
