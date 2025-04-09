import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/auth';
import { Navbar, Nav, Container, Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { FaHome } from "react-icons/fa";
import InfoTooltip from "./InfoTooltip";
import { FaUserCircle } from "react-icons/fa";

import logo from '../assets/logo.png';

import '../css/RegisterUser.css';

const RegisterUser = () => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [preview, setPreview] = useState(null);
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const navigate = useNavigate();

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        age: '',
        gender: '',
        weight: '',
        height: '',
        fitnessGoal: '',
        dailyCalorieGoal: '',
        dailyWaterGoal: '',
        trainerId: null,
        phone: '',
        profilePic: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
        }
    });

    const [selectedPackage, setSelectedPackage] = useState("3-months");

    const packages = [
        { id: "3-months", label: "3 Months Membership", price: 999 },
        { id: "6-months", label: "6 Months Membership", price: 1799 },
        { id: "12-months", label: "12 Months Membership", price: 2999 }
    ];

    useEffect(() => {
        localStorage.removeItem('token');
        fetchTrainers();
    }, []);

    const fetchTrainers = async () => {
        try {
            const response = await axiosInstance.get('/trainer');
            setTrainers(response.data.trainers);
        } catch (error) {
            console.error('Failed to fetch trainers:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("address.")) {
            const key = name.split(".")[1];
            setForm((prev) => ({
                ...prev,
                address: { ...prev.address, [key]: value }
            }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, profilePic: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSelectTrainer = (trainer) => {
        if (!form.fullName || !form.email || !form.password || !form.confirmPassword ||
            !form.phone || !form.age || !form.gender || !form.weight || !form.height ||
            !form.fitnessGoal || !form.address.street || !form.address.city || !form.address.state ||
            !form.address.pincode) {
            setError("Please complete all required fields in Step 1 before selecting a trainer.");
            return;
        }

        setSelectedTrainer(trainer);
        console.log(trainer._id)
        setForm((prev) => ({ ...prev, trainerId: trainer._id }));
        setError('');
        // setStep(3);
    };

    const onFormSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError('');

        try {
            const paymentSuccess = true;

            if (!paymentSuccess) {
                setError("Payment failed. Please try again.");
                return;
            }

            const formData = {};

            for (const key in form) {
                const value = form[key];

                if (key === "address" && typeof value === "object") {
                    const addressData = {};
                    for (const subKey in value) {
                        const subValue = value[subKey];
                        if (
                            subValue !== undefined &&
                            subValue !== null &&
                            !(typeof subValue === "string" && subValue.trim() === "")
                        ) {
                            addressData[subKey] = subValue;
                        }
                    }
                    if (Object.keys(addressData).length > 0) {
                        formData[key] = addressData;
                    }
                } else if (
                    value !== undefined &&
                    value !== null &&
                    !(typeof value === "string" && value.trim() === "")
                ) {
                    formData[key] = value;
                }
            }

            const response = await axiosInstance.post('/auth/register', formData);

            localStorage.setItem('token', response.data.token);
            navigate('/login');

        } catch (error) {
            setError(error?.response?.data?.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const stepLabels = ["Personal Info", "Trainer", "Payment"];

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top">
                <Container>
                    <Navbar.Brand><img
                        src={logo}
                        alt="FitMan Logo"
                        style={{ width: '50px', height: '50px', marginRight: '10px' }}
                    />Fitman</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto">
                            <Nav.Link as={Link} to="/" className="text-light">
                                <FaHome size={32} />
                            </Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div className="register-page">
                <div className="register-overlay"></div>

                <div className="register-card-wrapper">
                    <Card className="m-3 p-4 shadow-lg rounded bg-dark bg-opacity-75 text-light">
                        <Card.Body>
                            <h2 className="text-center mb-3">User Registration Form</h2>
                            <div>

                                <div className="d-flex justify-content-center mb-4 step-indicator">
                                    {stepLabels.map((label, i) => {
                                        const s = i + 1;
                                        return (
                                            <div key={s} className="text-center">
                                                <div className={`step-circle ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
                                                    {s}
                                                </div>
                                                <div className="step-label">{label}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {step === 1 && (
                                    <Form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="fullName"
                                                placeholder="Enter your full name"
                                                value={form.fullName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                placeholder="Enter your email"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Password</Form.Label>
                                            <InfoTooltip message="Password must contain at least one uppercase letter, one number, and one special character." />
                                            <Form.Control
                                                type="password"
                                                name="password"
                                                placeholder="Enter your password"
                                                value={form.password}
                                                onChange={(e) => {
                                                    const input = e.target.value;
                                                    handleChange(e);

                                                    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
                                                    setPasswordError(
                                                        input && !passwordRegex.test(input)
                                                            ? "Password must have at least one uppercase letter, one number, and one special character."
                                                            : ""
                                                    );
                                                }}
                                                required
                                            />
                                            {passwordError && <small className="text-danger">{passwordError}</small>}
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Confirm Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                name="confirmPassword"
                                                placeholder="Confirm your password"
                                                value={form.confirmPassword}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setConfirmPasswordError(
                                                        e.target.value !== form.password ? "Passwords do not match." : ""
                                                    );
                                                }}
                                                required
                                            />
                                            {confirmPasswordError && <small className="text-danger">{confirmPasswordError}</small>}
                                        </Form.Group>


                                        <Form.Group className="mb-3">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="phone"
                                                placeholder="Enter your Phone Number"
                                                value={form.phone}
                                                onChange={(e) => {
                                                    const input = e.target.value;
                                                    if (/^\d{0,10}$/.test(input)) {
                                                        handleChange(e);
                                                    }
                                                }}
                                                required
                                            />
                                            {form.phone && form.phone.length > 10 && (
                                                <small className="text-danger">Phone number must be 10 digits.</small>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Age</Form.Label>
                                            <InfoTooltip message="You should be of minimum 18 years." />
                                            <Form.Control
                                                type="number"
                                                name="age"
                                                placeholder="Enter your age"
                                                value={form.age}
                                                onChange={(e) => {
                                                    const input = e.target.value;

                                                    if (/^\d*$/.test(input) && Number(input) >= 0) {
                                                        handleChange(e);
                                                    }
                                                }}
                                                min="18"
                                                step="1"
                                                required
                                            />
                                            {form.age && form.age < 0 && (
                                                <small className="text-danger">Age cannot be negative.</small>
                                            )}
                                        </Form.Group>


                                        <Form.Group className="mb-3">
                                            <Form.Label>Gender</Form.Label>
                                            <Form.Select name="gender" value={form.gender} onChange={handleChange} required>
                                                <option value="" disabled>Select your gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </Form.Select>
                                        </Form.Group>

                                        <Row>
                                            <Col>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Weight (kg)</Form.Label>
                                                    <InfoTooltip message="You should weigh atleast 30 kg." />
                                                    <Form.Control
                                                        type="number"
                                                        name="weight"
                                                        placeholder="Enter your weight"
                                                        value={form.weight}
                                                        onChange={(e) => {
                                                            const input = e.target.value;

                                                            if (/^\d*\.?\d*$/.test(input) && Number(input) >= 0 && Number(input) <= 500) {
                                                                handleChange(e);
                                                            }
                                                        }}
                                                        min="30"
                                                        max="500"
                                                        step="0.1"
                                                        required
                                                    />
                                                    {form.weight && (form.weight < 30 || form.weight > 500) && (
                                                        <small className="text-danger">Weight must be between 30 and 500 kg.</small>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                            <Col>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Height (cm)</Form.Label>
                                                    <InfoTooltip message="You should be atleast 50 cm in height." />
                                                    <Form.Control
                                                        type="number"
                                                        name="height"
                                                        placeholder="Enter your height"
                                                        value={form.height}
                                                        onChange={(e) => {
                                                            const input = e.target.value;

                                                            if (/^\d*$/.test(input) && Number(input) >= 0 && Number(input) <= 250) {
                                                                handleChange(e);
                                                            }
                                                        }}
                                                        min="50"
                                                        max="250"
                                                        step="1"
                                                        required
                                                    />
                                                    {form.height && (form.height < 50 || form.height > 250) && (
                                                        <small className="text-danger">Height must be between 50 and 250 cm.</small>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Fitness Goal</Form.Label>
                                            <Form.Select name="fitnessGoal" value={form.fitnessGoal} onChange={handleChange} required>
                                                <option value="" disabled>Select your goal</option>
                                                <option value="weight loss">Weight Loss</option>
                                                <option value="muscle gain">Muscle Gain</option>
                                                <option value="endurance">Endurance</option>
                                                <option value="maintenance">Maintenance</option>
                                            </Form.Select>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Daily Calorie Goal</Form.Label>
                                            <InfoTooltip message="You should aim for at most 2200 kcal calorie goal." />
                                            <Form.Control
                                                type="number"
                                                name="dailyCalorieGoal"
                                                placeholder="Enter daily calorie goal"
                                                value={form.dailyCalorieGoal}
                                                onChange={(e) => {
                                                    const input = e.target.value;

                                                    if (/^\d*$/.test(input) && Number(input) >= 0 && Number(input) <= 2200) {
                                                        handleChange(e);
                                                    }
                                                }}
                                                min="0"
                                                max="2200"
                                                step="1"
                                                required
                                            />
                                            {form.dailyCalorieGoal && (form.dailyCalorieGoal < 0 || form.dailyCalorieGoal > 2200) && (
                                                <small className="text-danger">Daily Calorie Goal must be between 0 and 2200.</small>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Daily Water Goal (glasses)</Form.Label>
                                            <InfoTooltip message="Drink at most 8 glasses of water." />
                                            <Form.Control
                                                type="number"
                                                name="dailyWaterGoal"
                                                placeholder="Enter daily water goal"
                                                value={form.dailyWaterGoal}
                                                onChange={(e) => {
                                                    const input = e.target.value;

                                                    if (/^\d*$/.test(input) && Number(input) >= 0 && Number(input) <= 8) {
                                                        handleChange(e);
                                                    }
                                                }}
                                                min="0"
                                                max="8"
                                                step="1"
                                                required
                                            />
                                            {form.dailyWaterGoal && (form.dailyWaterGoal < 0 || form.dailyWaterGoal > 8) && (
                                                <small className="text-danger">Daily Water Goal must be between 0 and 8 glasses.</small>
                                            )}
                                        </Form.Group>

                                        <Card className="mb-4">
                                            <Card.Body>
                                                <Card.Title className="mb-3">Enter Address Details</Card.Title>

                                                <Row>
                                                    <Col md={12}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Street</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="address.street"
                                                                placeholder="Enter address street"
                                                                value={form.address.street}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>City</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="address.city"
                                                                placeholder="Enter city"
                                                                value={form.address.city}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>State</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="address.state"
                                                                placeholder="Enter state"
                                                                value={form.address.state}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Pincode</Form.Label>
                                                            <InfoTooltip message="Pincode should have 6 digits." />
                                                            <Form.Control
                                                                type="text"
                                                                name="address.pincode"
                                                                placeholder="Enter pincode"
                                                                value={form.address.pincode}
                                                                onChange={(e) => {
                                                                    const input = e.target.value;

                                                                    if (/^\d{0,6}$/.test(input)) {
                                                                        handleChange(e);
                                                                    }
                                                                }}
                                                                required
                                                            />
                                                            {form.address.pincode && !/^\d{6}$/.test(form.address.pincode) && (
                                                                <small className="text-danger">Pincode must be exactly 6 digits.</small>
                                                            )}
                                                        </Form.Group>
                                                    </Col>

                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Country</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="address.country"
                                                                placeholder="Enter country"
                                                                // value={form.address.country}
                                                                value="India"
                                                                disabled="true"
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>


                                        <Form.Group className="mb-3">
                                            <Form.Label>Profile Picture</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            {preview && (
                                                <div className="mt-2 text-center">
                                                    <img src={preview} alt="Preview" style={{ maxWidth: "150px", borderRadius: "10px" }} />
                                                </div>
                                            )}
                                        </Form.Group>

                                        <Button className="w-100" type="submit">
                                            Next: Select Trainer
                                        </Button>
                                    </Form>
                                )}

                                {step === 2 && (
                                    <div>
                                        <h4 className="text-center mb-4">Choose a Trainer</h4>
                                        <Row>
                                            {trainers.map((trainer) => (
                                                (trainer.specialization.includes(form.fitnessGoal)) ? (<Col md={6} key={trainer._id} className="mb-3">
                                                    <Card
                                                        className={`trainer-card ${form.trainerId === trainer._id ? "border-primary" : ""}`}
                                                        onClick={() => handleSelectTrainer(trainer)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        {trainer.profilePic ? (
                                                            <Card.Img variant="top" src={trainer.profilePic} alt={trainer.fullName} className="trainer-img" />
                                                        ) : (
                                                            <div className="profile-placeholder">
                                                                <FaUserCircle className="profile-icon" />
                                                            </div>
                                                        )}

                                                        <Card.Body>
                                                            <Card.Title>{trainer.fullName}</Card.Title>
                                                            <Card.Text>
                                                                <strong>Specialization:</strong> {trainer.specialization.join(", ")} <br />
                                                                <strong>About:</strong> {trainer.bio} <br />
                                                                <strong>Experience:</strong> {trainer.experience} years
                                                            </Card.Text>
                                                        </Card.Body>

                                                    </Card>
                                                </Col>) : (<div className="text-center text-danger">No Trainers Available.</div>)
                                            ))}
                                        </Row>

                                        {selectedTrainer && (
                                            <Alert variant="info">
                                                Selected Trainer: <strong>{selectedTrainer.fullName}</strong>
                                            </Alert>
                                        )}

                                        <div className="d-flex justify-content-between mt-4">
                                            <Button variant="secondary" onClick={prevStep}>Back</Button>
                                            <Button onClick={nextStep} disabled={!selectedTrainer}>Next: Payment</Button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <Form onSubmit={onFormSubmit}>
                                        <h4 className="text-center mb-4">Complete Your Payment</h4>

                                        <Card className="mb-3">
                                            <Card.Body>
                                                <h5>User Summary</h5>
                                                <p><strong>Name:</strong> {form.fullName}</p>
                                                <p><strong>Email:</strong> {form.email}</p>
                                                <p><strong>Trainer:</strong> {selectedTrainer?.fullName}</p>
                                                <p><strong>Fitness Goal:</strong> {form.fitnessGoal}</p>
                                            </Card.Body>
                                        </Card>

                                        <Row>
                                            {packages.map((pkg) => (
                                                <Col md={4} key={pkg.id}>
                                                    <Card
                                                        className={`mb-3 package-card ${selectedPackage === pkg.id ? "selected" : ""}`}
                                                        onClick={() => setSelectedPackage(pkg.id)}
                                                    >
                                                        <Card.Body>
                                                            <h4>{pkg.label}</h4>
                                                            <p><strong>Price:</strong> ₹{pkg.price}</p>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}

                                            <Col md={3}>
                                                <Button className="w-100 mt-3" variant="secondary" onClick={prevStep}>Back</Button>
                                            </Col>

                                            <Col md={9}>
                                                <Button className="w-100 mt-3" type="submit" disabled={loading}>
                                                    {loading ? "Registering..." : `Pay ₹${packages.find(p => p.id === selectedPackage).price} & Register`}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                )}

                                {error && <Alert variant="danger" className="text-center mt-3">{error}</Alert>}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default RegisterUser;
