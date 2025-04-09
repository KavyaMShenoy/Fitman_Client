import React, { useState } from "react";
import { Card, Badge, Accordion, Modal, Button } from "react-bootstrap";
import { format } from "date-fns";

const mealTypeInfo = {
    breakfast: { label: "Breakfast", color: "warning", icon: "🥣" },
    lunch: { label: "Lunch", color: "success", icon: "🍱" },
    dinner: { label: "Dinner", color: "primary", icon: "🍽️" },
    snack: { label: "Snack", color: "info", icon: "🍎" },
};

const getDailySummary = (meals) => {
    return meals.reduce(
        (summary, meal) => {
            return {
                calories: summary.calories + (meal.calories || 0),
                protein: summary.protein + (meal.protein || 0),
                carbs: summary.carbs + (meal.carbs || 0),
                fats: summary.fats + (meal.fats || 0),
                fiber: summary.fiber + (meal.fiber || 0),
            };
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
};

const NutritionTimeline = ({ nutritionEntries }) => {
    const lastFiveDays = nutritionEntries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const [descModal, setDescModal] = useState({ show: false, content: "" });

    const handleShowDescription = (desc) => {
        setDescModal({ show: true, content: desc });
    };

    const handleCloseDescription = () => {
        setDescModal({ show: false, content: "" });
    };

    const [trainerCommentModal, setTrainerCommentModal] = useState({ show: false, content: "" });

    const handleShowTrainerComment = (desc) => {
        setTrainerCommentModal({ show: true, content: desc });
    };

    const handleCloseTrainerComment = () => {
        setTrainerCommentModal({ show: false, content: "" });
    };

    return (
        <div
            className="rounded-4 shadow-sm p-3"
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                maxHeight: "75vh",
                overflowY: "auto",
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
        >
            <Accordion alwaysOpen>
                {lastFiveDays.map((entry, idx) => {
                    const summary = getDailySummary(entry.mealEntries);

                    return (
                        <Accordion.Item
                            style={{
                                backgroundColor: "#121212",
                                color: "#f8f9fa",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                                borderRadius: "12px",
                            }}
                            eventKey={idx.toString()}
                            key={idx}
                            className="mb-3"
                        >
                            <Accordion.Header style={{
                                backgroundColor: "#1f1f1f",
                                color: "#ffffff",
                                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                padding: "10px 15px",
                                fontWeight: "600",
                            }}>
                                <div className="d-flex flex-column w-100">
                                    <span style={{ fontSize: "1rem", fontWeight: "600" }}>
                                        {format(new Date(entry.date), "PPP")}
                                    </span>
                                    <div className="d-flex justify-content-between small text-muted">
                                        <span>{entry.mealEntries.length} meals</span>
                                        <span>
                                            {summary.calories} kcal • P:{summary.protein}g • C:{summary.carbs}g • F:{summary.fats}g
                                        </span>
                                    </div>
                                </div>
                            </Accordion.Header>

                            <Accordion.Body className="rounded-bottom-4 p-3" style={{
                                backgroundColor: "#1a1a1a",
                                color: "#f1f1f1",
                            }}>
                                {entry.waterIntake && (
                                    <div className="mb-2 d-flex align-items-center text-primary fw-semibold">
                                        💧 Water Intake:
                                        <span className="text-dark" style={{ marginLeft: "3px" }}>
                                            {entry.waterIntake} ml
                                        </span>
                                    </div>
                                )}

                                {entry.mealEntries.map((meal, i) => {
                                    const { icon, color } = mealTypeInfo[meal.mealType] || {};
                                    const maxChars = 120;
                                    const desc = meal.description || "";
                                    const shortDesc = desc.length > maxChars ? desc.substring(0, maxChars) + "..." : desc;

                                    const trainerComment = meal.trainerComment || "";
                                    const shortTrainerComment = trainerComment.length > maxChars ? trainerComment.substring(0, maxChars) + "..." : trainerComment;

                                    return (
                                        <Card
                                            key={i}
                                            className={`mb-2 border-0 rounded-4 text-white shadow-sm bg-${color || "info"}`}
                                            style={{
                                                fontSize: "1rem",
                                                lineHeight: "1.4",
                                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                                border: "1px solid rgba(255, 255, 255, 0.1)"
                                            }}
                                        >
                                            <Card.Body className="py-2 px-3">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="w-100">
                                                        <div
                                                            className="fw-semibold d-flex flex-wrap align-items-center text-white mb-2"
                                                            style={{ fontSize: "0.95rem" }}
                                                        >
                                                            <Badge bg="dark" className="me-2" style={{ padding: "5px 10px", fontSize: "0.9rem", lineHeight: "1.4" }}>
                                                                {icon} {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                                                            </Badge>
                                                            <span className="me-2">
                                                                {meal.foodName} - <span className="fw-bold">{meal.calories} kcal</span>
                                                            </span>
                                                            <span className="me-2">P: {meal.protein}g</span>
                                                            <span className="me-2">C: {meal.carbs}g</span>
                                                            <span className="me-2">F: {meal.fats}g</span>
                                                            <span className="me-2">Fiber: {meal.fiber}g</span>
                                                        </div>

                                                        {desc && (
                                                            <p className="mb-1 px-2 text-light" style={{ fontSize: "0.95rem" }}>
                                                                <span className="me-2">Description : </span>
                                                                {shortDesc}
                                                                {desc.length > maxChars && (
                                                                    <span
                                                                        className="text-decoration-underline ms-2"
                                                                        role="button"
                                                                        style={{ fontWeight: "bold", color: "#f8f9fa" }}
                                                                        onClick={() => handleShowDescription(desc)}
                                                                    >
                                                                        Show more
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}

                                                        {trainerComment && (
                                                            <p className="mb-1 px-2 text-light" style={{ fontSize: "0.95rem" }}>
                                                                <span className="me-2">Trainer Comment : </span>
                                                                {shortTrainerComment}
                                                                {trainerComment.length > maxChars && (
                                                                    <span
                                                                        className="text-decoration-underline ms-2"
                                                                        role="button"
                                                                        style={{ fontWeight: "bold", color: "#f8f9fa" }}
                                                                        onClick={() => handleShowTrainerComment(trainerComment)}
                                                                    >
                                                                        Show more
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                            </Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>

            <Modal show={descModal.show} onHide={handleCloseDescription} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Meal Description</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ whiteSpace: "pre-wrap" }}>{descModal.content}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDescription}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={trainerCommentModal.show} onHide={handleCloseTrainerComment} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Trainer Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ whiteSpace: "pre-wrap" }}>{trainerCommentModal.content}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseTrainerComment}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default NutritionTimeline;