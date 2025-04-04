import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div>
            <div className="text-center bg-danger text-light">
                <h1 className="pt-2 pb-3">Unauthorized Access</h1>
            </div>

            <div className="d-flex justify-content-center align-items-center text-danger" style={{ height: '60vh', fontSize: "Larger" }}>
                You do not have permission to access this page.
                <Link to="/home">Go back to Home</Link>
            </div>

        </div>
    );
};

export default Unauthorized;