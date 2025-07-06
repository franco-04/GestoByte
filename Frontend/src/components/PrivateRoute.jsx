import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('authToken');
  const user = authService.getCurrentUser();
  const userRole = user?.rol?.toLowerCase();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
