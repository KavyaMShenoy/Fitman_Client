import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthRoute = ({ element }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    return token ? element : <Navigate to="/login" state={{ from: location }} />;
};

export default AuthRoute;