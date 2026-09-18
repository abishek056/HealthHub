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
import ManageBeds from './pages/hospital-admin/ManageBeds';
import TrackAmbulance from './pages/hospital-admin/TrackAmbulance';
import ManageOPD from './pages/hospital-admin/ManageOPD';
import PatientRecords from './pages/hospital-admin/PatientRecords';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hospitals" element={<HospitalList />} />
          <Route path="/hospitals/:id" element={<HospitalDetail />} />
          <Route path="/login" element={<Login />} />

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <EmergencyButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
