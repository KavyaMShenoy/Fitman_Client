import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FaHome, FaUserCircle } from "react-icons/fa";

import axiosInstance from '../utils/auth';

import { Navbar, Nav, Container, Form, Button, Alert, Card } from 'react-bootstrap';

import '../css/Login.css';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('token');
    }, []);

    const onFormSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            setError('');
            navigate('/');
        } catch (error) {
            setError(error?.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top">
                <Container>
                    <Navbar.Brand as={Link} to="/">Fitman</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link
                                as={Link}
                                to="/"
                                className="text-light"
                                style={{ textDecoration: "none" }}
                            >
                                <FaHome size={32} />
                            </Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div className="login-page">
                <div className="login-overlay"></div>

                <div className="login-card-wrapper">
                    <Card className="p-4 shadow-lg rounded bg-dark bg-opacity-75 text-light">
                        <Card.Body>
                            <h2 className="text-center mb-3">Login</h2>

                            <div className="text-center">
                                <FaUserCircle size={100} className="mb-3 text-light" />
                            </div>

                            <Form onSubmit={onFormSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <div className="text-center">
                                    <Button variant="primary" className="w-100" type="submit" disabled={loading}>
                                        {loading ? "Logging in..." : "Login"}
                                    </Button>
                                </div>

                                <div className="text-center mt-3">
                                    <Link to="/" className="text-light text-decoration-none">
                                        Forgot Password? <strong>Click here</strong>
                                    </Link>
                                </div>

                                {error && (
                                    <Alert variant="danger" className="text-center mt-2">
                                        {error}
                                    </Alert>
                                )}
                            </Form>

                            {/* <div className="text-center mt-3">
                                <Link to="/register" className="text-light text-decoration-none">
                                    Not registered yet? <strong>Register now</strong>
                                </Link>
                            </div> */}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default Login;