import React, { useState, useEffect, useContext } from "react";
import { Outlet } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import useTokenExpiry from "./hooks/useTokenExpiry";
import eventEmitter from "./utils/eventEmitter";

import "./App.css";

import { Spinner } from "react-bootstrap";
import { AuthContext } from "./contexts/AuthContext";

const App = () => {

    const { loading } = useContext(AuthContext);

    useTokenExpiry();

    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const handleCollapse = () => setExpanded(false);
        eventEmitter.on("collapseNavbar", handleCollapse);

        return () => {
            eventEmitter.off("collapseNavbar", handleCollapse);
        };
    }, []);

    if (loading) {
        return (<div className="mt-5 d-flex justify-content-center align-items-center" style={{ padding: '70px 0' }}>
            <Spinner animation="border" variant="light" />
            <div className="m-2 text-light">Loading...</div>
        </div>)
    }

    return (
        <>
            <Header expanded={expanded} onToggle={() => setExpanded(prev => !prev)} />
            <Outlet />
            <Footer />
        </>
    );
};

export default App;