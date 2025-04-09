import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/auth";
import eventEmitter from "../utils/eventEmitter";

import { Card, Button, Spinner, Row, Col, Alert, Form, Modal } from "react-bootstrap";
import { Calendar, CalendarPlus, XCircle } from "lucide-react";
import DatePicker from "react-datepicker";

import "../css/Appointment.css";

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/GlobalToastContext";

import AppointmentCalendar from "./AppointmentCalendar";

const AppointmentCard = ({ appointment, onCancel, number }) => {
    const { trainerId, appointmentDate, serviceType, status, _id } = appointment;
    const trainerName = trainerId?.fullName || "Trainer";

    const isToday = new Date(appointment.appointmentDate).toDateString() === new Date().toDateString();

    const getStatusVariant = (status) => {
        switch (status) {
            case "pending": return "warning";
            case "confirmed": return "primary";
            case "completed": return "success";
            case "cancelled": return "danger";
            default: return "secondary";
        }
    };

    return (
        <Card className={`shadow-lg rounded-4 bg-dark bg-opacity-75 text-light appointment-card ${isToday ? 'border-info border-3' : ''}`} >
            <Card.Body style={{ height: "250px" }}>
                <Card.Title className="fs-5 fw-bold text-center mb-3">
                    Appointment {number}
                </Card.Title>
                <Card.Text>
                    <strong>Trainer:</strong> {trainerName}<br />
                    <strong>Date:</strong> {new Date(appointmentDate).toLocaleDateString()}<br />
                    <strong>Service:</strong> <span className="text-titlecase">{serviceType.replace("_", " ")}</span><br />
                    <strong>Status:</strong>{" "}
                    <span className={`text-${getStatusVariant(status)} text-titlecase`}>{status}</span><br />
                    <strong>Time:</strong> 6 AM - 8 AM <br />
                </Card.Text>
                {status !== "cancelled" && status !== "completed" && (
                    <div className="d-flex justify-content-center">
                        {onCancel && (<Button variant="danger" onClick={() => onCancel(_id)} className="mt-2">
                            <XCircle size={16} className="me-2" /> Cancel Appointment
                        </Button>)}
                    </div>
                )}
            </Card.Body>
        </Card >
    );
};

const Appointments = () => {
    const navigate = useNavigate();

    const { userId, trainerId: assignedTrainerId } = useContext(AuthContext);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [appointments, setAppointments] = useState([]);
    const { showToastNotification } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        trainerId: "",
        appointmentDate: null,
        serviceType: ""
    });

    const [isTrainerLoading, setIsTrainerLoading] = useState(true);
    const [trainers, setTrainers] = useState([]);
    const [trainerError, setTrainerError] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);

    const [showCalendarView, setShowCalendarView] = useState(false);


    useEffect(() => {
        if (!userId || !assignedTrainerId) return;

        setForm((prev) => ({ ...prev, trainerId: assignedTrainerId }));

        fetchAppointments();
        fetchTrainers();

        const logoutHandler = () => navigate("/login");
        eventEmitter.on("logout", logoutHandler);
        return () => eventEmitter.off("logout", logoutHandler);
    }, [userId, assignedTrainerId, navigate]);

    const fetchAppointments = async () => {
        setError("");
        try {
            setIsLoading(true);
            const res = await axiosInstance.get(`/appointment`);
            setAppointments(res.data.appointments);
        } catch (err) {
            setError("Failed to fetch appointments.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrainers = async () => {
        setTrainerError("");
        try {
            setIsTrainerLoading(true);
            const res = await axiosInstance.get("/trainer");
            setTrainers(res.data.trainers || []);
        } catch (err) {
            setTrainerError("Failed to fetch trainers.");
        } finally {
            setIsTrainerLoading(false);
        }
    };

    const handleOpenCancelModal = (id) => {
        setAppointmentToCancel(id);
        setShowCancelModal(true);
    };

    const closeModal = () => {
        setShowCancelModal(false);
        setAppointmentToCancel(null);
    };

    const confirmCancellation = async () => {
        if (!appointmentToCancel) return;

        try {
            console.log(appointmentToCancel)
            await axiosInstance.put(`/appointment/cancel/${appointmentToCancel}`);
            fetchAppointments();
            showToastNotification("Appointment cancelled.", "success");
        } catch (err) {
            showToastNotification("Failed to cancel appointment.", "danger");
        } finally {
            setShowCancelModal(false);
            setAppointmentToCancel(null);
        }
    };

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setForm({ ...form, appointmentDate: date });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!form.trainerId || !form.appointmentDate || !form.serviceType) {
            return showToastNotification("❗ Please fill all required fields.", "warning");
        }

        setSubmitting(true);
        try {
            await axiosInstance.post("/appointment/create", {
                ...form,
                appointmentDate: new Date(form.appointmentDate).toISOString(),
                userId,
            });
            await fetchAppointments();
            setForm({ trainerId: assignedTrainerId, appointmentDate: null, serviceType: "" });
            showToastNotification("Appointment created successfully!", "success");
        } catch (err) {
            showToastNotification("Failed to create appointment.", "danger");
        } finally {
            setSubmitting(false);
        }
    };

    const now = new Date();
    const upcomingAppointments = appointments
        .filter(a => new Date(a.appointmentDate) > now)
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    const pastAppointments = appointments
        .filter(a => new Date(a.appointmentDate) <= now)
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    console.log(appointments, pastAppointments)

    return (
        <>
            <div className="appointment-page">
                <div className="appointment-overlay"></div>

                <div className="appointment-card-wrapper">
                    <div className="p-4">
                        <Card className="mb-5 p-4 bg-dark bg-opacity-75 text-light shadow-lg">
                            <h4 className="mb-4 text-info d-flex align-items-center p-3">
                                <CalendarPlus className="me-2" /> Book New Appointment
                            </h4>
                            <Form onSubmit={handleFormSubmit}>
                                <Row className="mb-3 p-3">
                                    <Col md={6}>
                                        <Form.Group controlId="formTrainer">
                                            <Form.Label>Trainer</Form.Label>
                                            {isTrainerLoading ? (
                                                <Form.Control
                                                    type="text"
                                                    name="fullName"
                                                    value="Loading trainers..."
                                                />
                                            ) : trainerError ? (
                                                <Form.Control
                                                    type="text"
                                                    name="fullName"
                                                    value={trainerError}
                                                    className="text-danger"
                                                />
                                            ) : (
                                                <Form.Select name="trainerId" value={form.trainerId} onChange={handleFormChange} disabled>
                                                    <option value="">Select Trainer</option>
                                                    {trainers.map(t => (
                                                        <option key={t._id} value={t._id}>{t.fullName}</option>
                                                    ))}
                                                </Form.Select>
                                            )}
                                            <span title="Trainer is auto-assigned based on your registration.">
                                                <i className="bi bi-info-circle text-muted" />
                                            </span>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formService">
                                            <Form.Label>Service</Form.Label>
                                            <Form.Select name="serviceType" value={form.serviceType} onChange={handleFormChange}>
                                                <option value="">Select Service</option>
                                                <option value="personal_training">Personal Training</option>
                                                <option value="nutrition_plan">Nutrition Plan</option>
                                                <option value="rehabilitation">Rehabilitation</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3 p-3">
                                    <Col md={12}>
                                        <Form.Group controlId="formDate" className="w-100">
                                            <Form.Label className="text-light">Date</Form.Label>
                                            <div className="w-100">
                                                <DatePicker
                                                    selected={form.appointmentDate}
                                                    onChange={handleDateChange}
                                                    minDate={new Date()}
                                                    dateFormat="yyyy-MM-dd"
                                                    className="form-control w-100"
                                                    placeholderText="Select a date"
                                                    excludeDates={appointments
                                                        .filter(appt => appt.status !== "cancelled")
                                                        .map(appt => {
                                                            const date = new Date(appt.appointmentDate);
                                                            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                                        })}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>


                                <div className="d-flex justify-content-end p-3">
                                    <Button type="submit" variant="success" disabled={submitting || isTrainerLoading || trainerError}>
                                        {submitting ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Appointment"
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card>

                        <div className="appointment-section-container">
                            <div className="appointment-section-header">
                                <h2 className="appointment-section-title">
                                    <span className="me-2">My Appointments</span><Calendar />
                                </h2>
                            </div>

                            <div className="d-flex">
                                <Button
                                    variant="info"
                                    onClick={() => setShowCalendarView(prev => !prev)}
                                    className="mb-4 ms-auto glow-button"
                                >
                                    {showCalendarView ? "Show Card View" : "Show Calendar View"}
                                </Button>
                            </div>

                            {showCalendarView ? (
                                <AppointmentCalendar appointments={appointments} />
                            ) : (
                                <>
                                    <h4 className="section-heading mb-3">📅 Upcoming Appointments</h4>
                                    <div className="scrollable-section">
                                        <Row xs={1} md={2} lg={3} className="g-4 mt-3 mb-5 mx-3 justify-content-center">
                                            {isLoading ? (
                                                <div className="mt-5 d-flex justify-content-center align-items-center" style={{ padding: '70px 0' }}>
                                                    <Spinner animation="border" variant="light" />
                                                    <div className="m-2 text-light">Loading...</div>
                                                </div>
                                            ) :
                                                (!error) ? (upcomingAppointments.length > 0 ? (
                                                    upcomingAppointments.map((appt, index) => (
                                                        <Col key={appt._id}>
                                                            <AppointmentCard
                                                                appointment={appt}
                                                                onCancel={() => handleOpenCancelModal(appt._id)}
                                                                number={index + 1}
                                                            />
                                                        </Col>
                                                    ))
                                                ) : (
                                                    <Col md={6} className="d-flex justify-content-center">
                                                        <Alert variant="info" className="text-center w-100 mt-3">
                                                            No upcoming appointments.
                                                        </Alert>
                                                    </Col>
                                                )) :
                                                    (<Col md={6} className="d-flex justify-content-center">
                                                        <Alert variant="danger" className="text-center w-100 mt-3">
                                                            {error}
                                                        </Alert>
                                                    </Col>)}
                                        </Row>
                                    </div>

                                    <h4 className="section-heading mb-3">📁 Past Appointments</h4>
                                    <div className="scrollable-section">
                                        <Row xs={1} md={2} lg={3} className="g-4 mt-3 mb-5 mx-3 justify-content-center">
                                            {isLoading ? (
                                                <div className="mt-5 d-flex justify-content-center align-items-center" style={{ padding: '70px 0' }}>
                                                    <Spinner animation="border" variant="light" />
                                                    <div className="m-2 text-light">Loading...</div>
                                                </div>
                                            ) :
                                                (!error) ? (pastAppointments.length > 0 ? (
                                                    pastAppointments.map((appt, index) => (
                                                        <Col key={appt._id}>
                                                            <AppointmentCard appointment={appt} number={index + 1} />
                                                        </Col>
                                                    ))
                                                ) : (
                                                    <Col md={6} className="d-flex justify-content-center">
                                                        <Alert variant="light" className="text-center w-100 mt-3">
                                                            No past appointments.
                                                        </Alert>
                                                    </Col>
                                                )) :
                                                    (<Col md={6} className="d-flex justify-content-center">
                                                        <Alert variant="danger" className="text-center w-100 mt-3">
                                                            {error}
                                                        </Alert>
                                                    </Col>)}
                                        </Row>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showCancelModal} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Cancel Appointment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to cancel this appointment?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModal}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={confirmCancellation}>
                        Yes, Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Appointments;