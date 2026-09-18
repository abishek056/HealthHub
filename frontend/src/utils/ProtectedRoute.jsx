import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * ProtectedRoute higher-order component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components to render if authorized
 * @param {Array<string>} [props.allowedRoles] - Optional array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  // Show a loading state while we verify token from localStorage initially
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login page with the return url
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is provided, check if the user's role is in the list
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      // User doesn't have the required role
      toast.error('You do not have permission to access this page');
      
      // Redirect based on what role they actually have
      if (role === 'super_admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (role === 'hospital_admin') {
        return <Navigate to="/hospital/dashboard" replace />;
      }
      
      return <Navigate to="/" replace />;
    }
  }

  // If authenticated and authorized, render the children
  return children;
};

export default ProtectedRoute;
