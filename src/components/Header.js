import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { FaUserCircle } from "react-icons/fa";

import { Navbar, Nav, Dropdown, Container, Button } from "react-bootstrap";

import eventEmitter from "../utils/eventEmitter";

import logo from '../assets/logo.png';

import "../css/Header.css";

const Header = ({ expanded, onToggle }) => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeLink, setActiveLink] = useState(location.pathname);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(!!localStorage.getItem("token"));
    eventEmitter.emit("logout");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top" expanded={expanded} onToggle={onToggle}>
      <Container>
        <Navbar.Brand>
          <img
            src={logo}
            alt="FitMan Logo"
            style={{ width: '40px', height: '40px', marginRight: '8px', verticalAlign: 'middle' }}
          />
          <span style={{ verticalAlign: 'middle' }}>FitMan</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isLoggedIn ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/"
                  className={activeLink === "/" ? "active-link" : ""}
                  onClick={() => eventEmitter.emit("collapseNavbar")}
                >
                  Home
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/appointments"
                  className={activeLink === "/appointments" ? "active-link" : ""}
                  onClick={() => eventEmitter.emit("collapseNavbar")}
                >
                  Appointments
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/trainer"
                  className={activeLink === "/trainer" ? "active-link" : ""}
                  onClick={() => eventEmitter.emit("collapseNavbar")}
                >
                  My Trainer
                </Nav.Link>

                <Dropdown align="end" className="ms-2">
                  <Dropdown.Toggle variant="outline-light" id="profile-dropdown">
                    <FaUserCircle size={24} /> My Profile
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/myAccount" className={activeLink === "/myAccount" ? "active-link" : ""} onClick={() => eventEmitter.emit("collapseNavbar")}>My Account</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/payments" className={activeLink === "/payments" ? "active-link" : ""} onClick={() => eventEmitter.emit("collapseNavbar")}>My Payment</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                      handleLogout();
                      eventEmitter.emit("collapseNavbar");
                    }}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>) : (
              <Button
                as={Link}
                to="/login"
                variant={activeLink === "/login" ? "primary" : "outline-light"}
                className="ms-2"
                onClick={() => eventEmitter.emit("collapseNavbar")}
              >
                Login
              </Button>

            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;