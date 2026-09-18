import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';

import Home from './pages/public/Home';
import HospitalList from './pages/public/HospitalList';
import HospitalDetail from './pages/public/HospitalDetail';
import EmergencyButton from './components/emergency/EmergencyButton';

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
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <EmergencyButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
