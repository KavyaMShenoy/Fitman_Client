import React from "react";
import { Outlet } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import useTokenExpiry from "./hooks/useTokenExpiry";

import "./App.css";

const App = () => {

    useTokenExpiry();

    return (
        <>
            <Header />
            <Outlet />
            <Footer />
        </>
    );
};

export default App;