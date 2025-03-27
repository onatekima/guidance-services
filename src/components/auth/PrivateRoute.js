import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ requiredRole }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && currentUser.role !== requiredRole) {
    // Wrong role
    return <Navigate to={currentUser.role === 'guidance' ? '/guidance' : '/'} replace />;
  }
  
  // User is authenticated and has the right role
  return <Outlet />;
};

export default PrivateRoute;
