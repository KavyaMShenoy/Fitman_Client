import React from "react";
import { Link } from "react-router-dom";

import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

import { Container, Row, Col } from "react-bootstrap";

import "../css/Footer.css";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-3" style={{ width: "100%" }}>
      <Container>
        <Row>
          <Col md={6}>
            <h5>Fitman</h5>
            <p>Empowering you on your fitness journey.</p>
            <p>&copy; 2025 Fitman. All Rights Reserved.</p>
          </Col>

          <Col md={3}>
            <h5>Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/privacy" className="text-light">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-light">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-light">Contact</Link></li>
            </ul>
          </Col>

          <Col md={3}>
            <h5>Follow Us</h5>
            <div className="d-flex gap-3">
              <Link to="#" className="text-light"><FaFacebook size={24} /></Link>
              <Link to="#" className="text-light"><FaTwitter size={24} /></Link>
              <Link to="#" className="text-light"><FaInstagram size={24} /></Link>
              <Link to="#" className="text-light"><FaLinkedin size={24} /></Link>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;