import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const session = sessionStorage.getItem('adminSession');
    
    if (!session) {
        // Jika tidak ada session, paksa redirect ke form login admin
        return <Navigate to="/admin/login" replace />;
    }

    try {
        const parsedSession = JSON.parse(session);
        // Validasi minimal keberadaan token dalam session
        if (!parsedSession.token) {
            return <Navigate to="/admin/login" replace />;
        }
    } catch (e) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
