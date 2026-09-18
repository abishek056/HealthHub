import React, { useState, useEffect, useCallback } from 'react';
import HospitalAdminLayout from '../../components/admin/HospitalAdminLayout';
import PatientTable from '../../components/admin/PatientTable';
import {
  getPatientRecords,
  createPatientRecord,
  updatePatientRecord,
  deletePatientRecord
} from '../../services/adminService';
import { ShieldAlert, FileText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientRecords() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await getPatientRecords({
        page,
        search: search || undefined,
        per_page: 10,
      });

      const items = res?.data || [];
      setRecords(items);

      if (res?.meta) {
        setPagination(res.meta);
      } else if (res?.current_page) {
        setPagination({
          current_page: res.current_page,
          last_page: res.last_page,
          total: res.total,
          per_page: res.per_page,
          from: res.from,
          to: res.to,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(currentPage, searchQuery);
  }, [fetchRecords, currentPage, searchQuery]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCreate = async (formData) => {
    await createPatientRecord(formData);
    fetchRecords(1, searchQuery);
  };

  const handleUpdate = async (id, formData) => {
    await updatePatientRecord(id, formData);
    fetchRecords(currentPage, searchQuery);
  };

  const handleDelete = async (id) => {
    await deletePatientRecord(id);
    fetchRecords(currentPage, searchQuery);
  };

  return (
    <HospitalAdminLayout
      title="Patient Records Management"
      subtitle="Encrypted hospital records, medical diagnoses, and admission histories (Tenant-Isolated)"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Strict tenant isolation ensures staff can only access patients belonging to this facility</span>
          </div>

          <button
            onClick={() => fetchRecords(currentPage, searchQuery)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <PatientTable
          records={records}
          pagination={pagination}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onPageChange={(page) => setCurrentPage(page)}
          onCreateRecord={handleCreate}
          onUpdateRecord={handleUpdate}
          onDeleteRecord={handleDelete}
          loading={loading}
        />
      </div>
    </HospitalAdminLayout>
  );
}
