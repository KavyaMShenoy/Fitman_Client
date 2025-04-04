import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { FaUserCircle } from "react-icons/fa";

import { Navbar, Nav, Dropdown, Container, Button } from "react-bootstrap";

import eventEmitter from "../utils/eventEmitter";

import "../css/Header.css";

const Header = () => {
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
    <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top">
      <Container>
        <Navbar.Brand as={Link} to="/">Fitman</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {isLoggedIn ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/"
                  className={activeLink === "/" ? "active-link" : ""}
                >
                  Home
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/appointments"
                  className={activeLink === "/appointments" ? "active-link" : ""}
                >
                  Appointments
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/reminder"
                  className={activeLink === "/reminder" ? "active-link" : ""}
                >
                  Reminders
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/payments"
                  className={activeLink === "/payments" ? "active-link" : ""}
                >
                  Payments
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/trainer"
                  className={activeLink === "/trainer" ? "active-link" : ""}
                >
                  My Trainer
                </Nav.Link>

                <Dropdown align="end" className="ms-2">
                  <Dropdown.Toggle variant="outline-light" id="profile-dropdown">
                    <FaUserCircle size={24} /> My Profile
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/myAccount">My Account</Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>) : (
              <Button
                as={Link}
                to="/login"
                variant={activeLink === "/login" ? "primary" : "outline-light"}
                className="ms-2"
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