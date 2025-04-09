import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../utils/auth";
import eventEmitter from "../utils/eventEmitter";
import { FaUserCircle } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { ToastContainer as ToastifyContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert, Modal, Form } from "react-bootstrap";

import socket from "../utils/socket";
import "../css/Trainer.css";

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/GlobalToastContext";
import Messenger from "./Messenger";

const TrainerProfile = () => {
    const navigate = useNavigate();

    const { userId, trainerId } = useContext(AuthContext);
    const [trainer, setTrainer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showToastNotification } = useToast();
    const [showEditModal, setShowEditModal] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        specialization: [],
        experience: 0,
        bio: "",
        profilePic: ""
    });

    const [feedbacks, setFeedbacks] = useState("");
    const [feedbacksError, setFeedbacksError] = useState("");

    const [rating, setRating] = useState(null);
    const [hoverRating, setHoverRating] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const [newMessageAlert, setNewMessageAlert] = useState(false);

    useEffect(() => {
        if (!userId) return;

        socket.emit("join", userId);

        const handleNewMessage = (message) => {
            const isIncoming = (message.senderId === trainerId && message.receiverId === userId);
            if (!showChat && isIncoming) {
                toast.info("📩 New message from your trainer!", {
                    toastId: "trainerMessage",
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                setNewMessageAlert(true);
            }
        };

        socket.off("newMessage").on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [userId, showChat, trainerId]);


    useEffect(() => {
        if (!trainerId) return;

        const fetchTrainerProfile = async () => {
            setError("");
            try {
                if (!trainerId) {
                    setTrainer(null);
                    return;
                }
                const { data } = await axiosInstance.get(`/trainer/${trainerId}`);

                if (!data || !data.trainer) {
                    setTrainer(null);
                } else {
                    setTrainer(data.trainer);
                    setForm({
                        fullName: data.trainer.fullName,
                        email: data.trainer.email,
                        specialization: data.trainer.specialization,
                        experience: data.trainer.experience,
                        bio: data.trainer.bio,
                        profilePic: data.trainer.profilePic
                    });
                }
            } catch (error) {
                setError("Failed to fetch trainer profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrainerProfile();

        const handleLogout = () => navigate("/login");
        eventEmitter.on("logout", handleLogout);

        return () => {
            eventEmitter.off("logout", handleLogout);
        };
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        try {
            await axiosInstance.put(`/trainer/update/${trainerId}`, form);
            setShowEditModal(false);
            showToastNotification("Profile updated successfully.", "success");
        } catch (error) {
            showToastNotification("Failed to update profile.", "danger");
            setShowEditModal(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosInstance.delete(`/trainer/delete/${trainerId}`);
            showToastNotification("Profile deleted successfully.", "success");
            navigate("/trainers");
        } catch (error) {
            showToastNotification("Failed to delete profile.", "danger");
        }
    };

    const fetchFeedbacks = async () => {
        setFeedbacksError("");
        try {
            const res = await axiosInstance.get(`/trainer/feedbacks/${trainerId}`);
            const { feedback } = res.data;
            if (feedback) {
                setFeedbacks(feedback.feedback || "");
                setRating(feedback.rating || null);
            }
        } catch (error) {
            setFeedbacksError("Failed to load feedbacks.");
        }
    };


    const openFeedbackModal = () => {
        fetchFeedbacks();
        setShowFeedbackModal(true);
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!rating) return alert("Please select a rating.");

        setIsSubmitting(true);

        const payload = {
            user: userId,
            feedback: feedbacks.trim(),
            rating
        };

        try {
            await axiosInstance.put(`/trainer/feedbacks/${trainerId}`, payload);
            showToastNotification(
                feedbacks ? "Feedback updated successfully." : "Feedback submitted successfully.",
                "success"
            );

            await fetchFeedbacks();
            setShowFeedbackModal(false);
        } catch (error) {
            showToastNotification("Failed to submit feedback.", "danger");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: "80vh" }} className="d-flex justify-content-center align-items-center">
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: "80vh" }} className="d-flex justify-content-center align-items-center">
                <Alert variant="danger" className="text-center">{error}</Alert>
            </div>
        );
    }

    if (!trainer) {
        return (
            <Container className="py-5 text-center">
                <div style={{ minHeight: "80vh" }} className="d-flex flex-column justify-content-center align-items-center">
                    <Alert variant="warning">No trainer profile available.</Alert>
                    <Button variant="primary" className="mt-3" onClick={() => navigate("/")}>
                        Back to Home
                    </Button>
                </div>
            </Container>

        );
    }

    return (
        <div className="trainer-page">
            <div className="trainer-overlay"></div>

            <Row className="justify-content-center trainer-card-wrapper">
                <Col md={8}>
                    <Card className="m-1 p-3 shadow-lg rounded bg-dark bg-opacity-50 text-light" style={{ border: "1px solid #fff" }}>
                        {trainer.profilePic ? (
                            <Card.Img
                                variant="top"
                                src={trainer.profilePic}
                                alt={trainer.fullName}
                                style={{ height: "300px", objectFit: "cover", borderTopLeftRadius: "20px", borderTopRightRadius: "20px" }}
                            />
                        ) : (
                            <div className="profile-placeholder" style={{ height: "300px" }}>
                                <FaUserCircle className="profile-icon" />
                            </div>
                        )}
                        <Card.Body>
                            <Card.Title className="text-center fs-3 fw-bold">{trainer.fullName}</Card.Title>
                            <Card.Text className="text-center fst-italic">{trainer.bio || "No bio available"}</Card.Text>
                            <ListGroup variant="flush" className="rounded">
                                <ListGroup.Item><strong>Email:</strong> {trainer.email}</ListGroup.Item>
                                <ListGroup.Item><strong>Specialization:</strong> {trainer.specialization.join(", ")}</ListGroup.Item>
                                <ListGroup.Item><strong>Experience:</strong> {trainer.experience} years</ListGroup.Item>
                            </ListGroup>
                            {/* <div className="d-flex justify-content-between mt-4">
                                <Button variant="primary" onClick={() => setShowEditModal(true)}>
                                    Edit Profile
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Profile
                                </Button>
                            </div> */}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                size="lg"
                centered
                className="edit-profile-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Edit Trainer Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                className="rounded-input"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Specialization</Form.Label>
                            <Form.Select
                                multiple
                                name="specialization"
                                value={form.specialization}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map((option) => option.value);
                                    setForm({ ...form, specialization: selected });
                                }}
                                className="rounded-input"
                            >
                                {["weight loss", "muscle gain", "endurance", "maintenance"].map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">Hold Ctrl (or Cmd) to select multiple.</Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Experience (Years)</Form.Label>
                            <Form.Control
                                type="number"
                                name="experience"
                                value={form.experience}
                                onChange={handleChange}
                                className="rounded-input"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Bio</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="bio"
                                rows={3}
                                value={form.bio}
                                onChange={handleChange}
                                className="rounded-input"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Profile Picture URL</Form.Label>
                            <Form.Control
                                type="text"
                                name="profilePic"
                                value={form.profilePic}
                                onChange={handleChange}
                                className="rounded-input"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="justify-content-between">
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Close
                    </Button>
                    <Button className="btn-grey" onClick={handleUpdate}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="floating-buttons d-flex justify-content-between px-3">
                <Button
                    variant="warning"
                    className="feedback-button"
                    onClick={openFeedbackModal}
                >
                    🌟 Provide Feedback & Ratings
                </Button>


                <Button
                    variant="primary"
                    className="chat-button"
                    onClick={() => {
                        setShowChat(true);
                        setNewMessageAlert(false);
                    }}
                >
                    💬 Chat with Trainer

                    {newMessageAlert && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            🔔
                        </span>
                    )}
                </Button>
            </div>

            <Modal
                show={showFeedbackModal}
                onHide={() => setShowFeedbackModal(false)}
                dialogClassName="chat-modal"
                contentClassName="chat-modal-content"
                aria-labelledby="feedback-modal-title"
                centered
                backdropClassName="custom-backdrop"
            >
                <Modal.Header closeButton className="modal-header">
                    <Modal.Title id="feedback-modal-title" className="w-100 text-center">
                        {feedbacks ? "Update Your Feedback" : "Provide Feedback & Rating"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="modal-body">
                    {!feedbacksError ? (<Form onSubmit={handleSubmitFeedback}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Your Feedback</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={7}
                                value={feedbacks}
                                onChange={(e) => setFeedbacks(e.target.value)}
                                maxLength={500}
                                required
                                className="rounded-4 shadow-sm no-resize-scroll"
                                placeholder="Share your experience with the trainer..."
                            />
                            <div className="text-end small text-muted mt-1">
                                {feedbacks?.length || 0}/500
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">Rating</Form.Label>
                            <div className="feedback-stars d-flex gap-2">
                                {[...Array(5)].map((_, index) => {
                                    const starValue = index + 1;
                                    return (
                                        <FaStar
                                            key={index}
                                            size={30}
                                            color={
                                                starValue <= (hoverRating || rating)
                                                    ? "#ffc107"
                                                    : "#e4e5e9"
                                            }
                                            onMouseEnter={() => setHoverRating(starValue)}
                                            onMouseLeave={() => setHoverRating(null)}
                                            onClick={() => setRating(starValue)}
                                            style={{ cursor: "pointer", transition: "color 0.2s" }}
                                        />
                                    );
                                })}
                            </div>
                            {!rating && (
                                <div className="text-danger small mt-1">Please select a rating</div>
                            )}
                        </Form.Group>

                        <div className="text-end">
                            <Button
                                type="submit"
                                variant="success"
                                className="px-4 rounded-pill"
                                disabled={isSubmitting || !rating || !feedbacks}
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : feedbacks
                                        ? "Update"
                                        : "Submit"}
                            </Button>
                        </div>
                    </Form>) : (
                        <div className="text-center text-danger fw-bold m-5">{feedbacksError}</div>
                    )}
                </Modal.Body>
            </Modal>

            <Modal
                show={showChat}
                onHide={() => setShowChat(false)}
                dialogClassName="chat-modal"
                contentClassName="chat-modal-content"
                aria-labelledby="chat-modal-title"
                centered
                backdropClassName="custom-backdrop"
            >
                <Modal.Header closeButton className="modal-header border-0">
                    <Modal.Title id="chat-modal-title" className="w-100 text-center fs-5 fw-bold text-primary">
                        💬 Messenger
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="chat-modal-body p-0">
                    <Messenger
                        trainerId={trainerId}
                        userId={userId}
                    />
                </Modal.Body>
            </Modal>

            <ToastifyContainer />
        </div>
    );
};

export default TrainerProfile;