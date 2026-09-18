import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';

import Home from './pages/public/Home';
import HospitalList from './pages/public/HospitalList';
import HospitalDetail from './pages/public/HospitalDetail';
import EmergencyButton from './components/emergency/EmergencyButton';
import ProtectedRoute from './utils/ProtectedRoute';

import HospitalDashboard from './pages/hospital-admin/Dashboard';
import ManageAppointments from './pages/hospital-admin/ManageAppointments';
import ManageBeds from './pages/hospital-admin/ManageBeds';
import TrackAmbulance from './pages/hospital-admin/TrackAmbulance';
import ManageOPD from './pages/hospital-admin/ManageOPD';
import PatientRecords from './pages/hospital-admin/PatientRecords';
import ManageStaff from './pages/hospital-admin/ManageStaff';

import SuperAdminDashboard from './pages/super-admin/Dashboard';
import HospitalManagement from './pages/super-admin/HospitalManagement';
import UserManagement from './pages/super-admin/UserManagement';
import Analytics from './pages/super-admin/Analytics';

import BookAppointment from './pages/patient/BookAppointment';
import PatientDashboard from './pages/patient/PatientDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hospitals" element={<HospitalList />} />
          <Route path="/hospitals/:id" element={<HospitalDetail />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/login" element={<Login />} />

          {/* Patient / Normal User Protected Routes */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Hospital Staff & Admin Protected Routes */}
          <Route
            path="/hospital/dashboard"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff', 'super_admin']}>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/appointments"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff', 'super_admin']}>
                <ManageAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/beds"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff', 'super_admin']}>
                <ManageBeds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/ambulances"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff', 'super_admin']}>
                <TrackAmbulance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/opd"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff', 'super_admin']}>
                <ManageOPD />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/patients"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff', 'super_admin']}>
                <PatientRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/staff"
            element={
              <ProtectedRoute allowedRoles={['hospital_admin', 'super_admin']}>
                <ManageStaff />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hospitals"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <HospitalManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <EmergencyButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
