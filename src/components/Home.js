import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaDumbbell, FaUserPlus } from "react-icons/fa";

import "../css/Home.css";

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

import eventEmitter from "../utils/eventEmitter";

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const { fullName: userName } = useContext(AuthContext);

  useEffect(() => {
    const handleLogout = () => {
      setIsLoggedIn(false);
    };

    eventEmitter.on("logout", handleLogout);
    
    return () => {
      eventEmitter.off("logout", handleLogout);
    };
  }, [isLoggedIn]);

  return (
    <div className="home-page">

      <div className="home-overlay"></div>

      <div className="home-card-wrapper">

        {!isLoggedIn ?
          (<>
            <div className="hero-section">
              <Container className="text-center">
                <h1 className="display-3 fw-bold text-light">Welcome to Fitman</h1>
                <p className="lead text-light">Transform Your Fitness Journey</p>
                <h3 className="tagline">"Stronger today, unstoppable tomorrow."</h3>
              </Container>
            </div>

            <Container className="card-container py-5">
              <Row className="g-4 justify-content-center">
                <Col md={5} className="m-3">
                  <Card className="feature-card neon-card shadow-lg">
                    <div className="card-content">
                      <FaDumbbell className="icon neon-icon" />
                      <Card.Title className="fw-bold">Trainer</Card.Title>
                      <Card.Text>
                        Manage clients, create personalized plans, and monitor progress.
                      </Card.Text>
                      <Link to="/register-trainer" className="btn btn-glow mt-3">
                        Register as Trainer
                      </Link>
                    </div>
                  </Card>
                </Col>

                <Col md={5} className="m-3">
                  <Card className="feature-card neon-card shadow-lg">
                    <div className="card-content">
                      <FaUserPlus className="icon neon-icon" />
                      <Card.Title className="fw-bold">User</Card.Title>
                      <Card.Text>
                        Track your workouts, set goals, and track and manage your nutrition.
                      </Card.Text>
                      <Link to="/register-user" className="btn btn-glow mt-3">
                        Register as User
                      </Link>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Container>
          </>) :
          (<>
            <Container className="card-container py-5">
              <Row className="text-center mb-5">
                <Col>
                  <h1 className="display-4 text-light">Welcome, <span className="text-light">{userName}!</span> 👋</h1>
                  <p className="lead text-warning">"Success is the sum of small efforts, repeated day in and day out!" 💪</p>
                </Col>
              </Row>

              <Row className="g-4 justify-content-center">
                <Col md={5} className="m-3">
                  <Card className="feature-card shadow-lg text-center h-100">
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div>
                        <h4>🏋️ Workouts</h4>
                        <p className="px-3">Track and manage your daily workouts.</p>
                      </div>
                      <Link to="/workout">
                        <Button variant="primary" size="lg">Go to Workouts</Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={5} className="m-3">
                  <Card className="feature-card shadow-lg text-center h-100">
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div>
                        <h4>🥗 Nutrition</h4>
                        <p className="px-3">Log your meals and track calories.</p>
                      </div>
                      <Link to="/nutrition">
                        <Button variant="success" size="lg">Go to Nutrition</Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </>)
        }
      </div>
    </div>
  );
};

export default Home;