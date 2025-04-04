import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Navigate } from 'react-router-dom';

import Spinner from 'react-bootstrap/Spinner';

const ProtectedRoute = ({ role, element }) => {

    const token = localStorage.getItem('token');

    const [loading, setLoading] = useState(true);
    const [loggedInRole, setLoggedInRole] = useState(null);


    useEffect(() => {
        const getLoggedInRole = () => {

            if (token) {
                try {
                    const decodedToken = jwtDecode(token);
                    setLoggedInRole(decodedToken.role);
                } catch (error) {
                    setLoggedInRole(null);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoggedInRole(null);
                setLoading(false);
            }

        }
        getLoggedInRole();
    }, [token])

    if (loading) {
        return (
            <div className="mt-5 d-flex flex-column justify-content-center align-items-center" style={{ paddingTop: '180px' }}>
                <Spinner animation="border" role="status" style={{ color: 'lightseagreen' }} />
                <div className="mt-2" style={{ color: 'lightseagreen' }}>Loading...</div>
            </div>
        );
    }

    return token ? ((role && role === loggedInRole) ? element : <Navigate to="/unauthorized" />) : <Navigate to="/login" />;
}

export default ProtectedRoute;