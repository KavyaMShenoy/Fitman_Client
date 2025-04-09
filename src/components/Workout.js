import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/auth";
import eventEmitter from "../utils/eventEmitter";

import { Row, Col, Card, ListGroup, Form, Button, Spinner, Dropdown, Modal, OverlayTrigger, Tooltip, Badge } from "react-bootstrap";

import "../css/Workout.css";
import { FaDumbbell } from "react-icons/fa";
import { MessageSquare, CheckCircle, CheckCheck } from 'lucide-react';
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/GlobalToastContext";

import WorkoutProgressReport from "./WorkoutProgressReport";

const Workout = () => {
  const navigate = useNavigate();
  const { userId, trainerId } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [workoutData, setWorkoutData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const { showToastNotification } = useToast();

  const [form, setForm] = useState({
    workoutName: "",
    workoutType: "",
    duration: "",
    caloriesBurned: "",
    sets: "",
    reps: "",
    weights: ""
  });

  const [validationErrors, setValidationErrors] = useState({});

  const [disbaleWorkoutTypes, setDisbaledWorkoutTypes] = useState([]);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState("");


  const workoutTypeColors = {
    strength: "primary",
    cardio: "warning",
    flexibility: "success",
    HIIT: "danger"
  };

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const userResponse = await axiosInstance.get(`/auth/profile/${userId}`);
        setUserData(userResponse?.data?.user);
      } catch (error) {
        showToastNotification("Failed to load user data.", "danger");
      }
    };

    const fetchWorkouts = async () => {
      try {
        const { data } = await axiosInstance.get("/workout/today");
        console.log(data, 123333, data?.workoutEntry);

        const workouts = Array.isArray(data?.workoutEntry)
          ? data.workoutEntry
          : data?.workoutEntry?.workouts || [];

        setWorkoutData(workouts);

        const existingWorkoutTypes = workouts.map((workout) => workout.workoutType);
        setDisbaledWorkoutTypes(existingWorkoutTypes || []);
      } catch (error) {
        console.error("Workout fetch error:", error);
        showToastNotification("Failed to load workouts.", "danger");
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserData(), fetchWorkouts()]);
      setIsLoading(false);
    };

    fetchData();

    const handleLogout = () => navigate("/login");
    eventEmitter.on("logout", handleLogout);

    return () => {
      eventEmitter.off("logout", handleLogout);
    };
  }, [userId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["duration", "sets", "reps", "weights"];
    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
    }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setForm({
      workoutName: "",
      workoutType: "",
      duration: "",
      caloriesBurned: "",
      sets: "",
      reps: "",
      weights: "",
    });
  };

  const validateForm = () => {
    const { workoutName, workoutType, duration, caloriesBurned, sets, reps, weights } = form;
    const newErrors = {};

    if (!workoutName.trim()) {
      newErrors.workoutName = "Workout name is required.";
    } else if (workoutName.length < 3 || workoutName.length > 300) {
      newErrors.workoutName = "Workout name must be between 3 and 300 characters.";
    }

    if (!workoutType) {
      newErrors.workoutType = "Please select a workout type.";
    }

    if (duration < 1 || duration > 300) {
      newErrors.duration = "Duration must be between 1 and 300 minutes.";
    }

    if (caloriesBurned < 1 || caloriesBurned > 5000) {
      newErrors.caloriesBurned = "Calories burned must be between 1 and 5000.";
    }

    if (sets < 1 || sets > 100) {
      newErrors.sets = "Sets must be between 1 and 100.";
    }

    if (reps < 1 || reps > 100) {
      newErrors.reps = "Reps must be between 1 and 100.";
    }

    if (weights < 1 || weights > 1000) {
      newErrors.weights = "Weights must be between 1 and 1000 kg.";
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const saveWorkout = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const newWorkout = {
      ...form,
      duration: parseInt(form.duration),
      caloriesBurned: parseInt(form.caloriesBurned),
      sets: parseInt(form.sets),
      reps: parseInt(form.reps),
      weights: parseInt(form.weights),
      completed: true,
    };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const payload = {
        userId,
        trainerId: trainerId,
        date: today.toISOString(),
        workoutEntry: newWorkout
      };

      setIsSaving(true);
      await axiosInstance.post("/workout/addWorkout", payload);

      const { data } = await axiosInstance.get("/workout/today");

      setWorkoutData(data?.workoutEntry?.workouts || []);
      console.log(data?.workoutEntry?.workouts)

      const existingWorkoutTypes = data?.workoutEntry?.workouts.map(workout => workout.workoutType);
      setDisbaledWorkoutTypes(existingWorkoutTypes || []);

      showToastNotification("Workout added successfully!", "success");
      resetForm();
    } catch (err) {
      showToastNotification("Failed to save workout.", "danger");
    } finally {
      setIsSaving(false);
    }

  };

  const handleTrainerCommentClick = (comment) => {
    setSelectedComment(comment);
    setShowCommentModal(true);
  };

  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text}`}>{text}</Tooltip>
  );

  const calculateCaloriesBurned = (sets, reps, weights, duration, workoutType) => {
    const totalReps = sets * reps;
    let calories = 0;

    switch (workoutType.toLowerCase()) {
      case "strength":
        calories = (totalReps * (0.1 + weights * 0.005)) + (duration * 4);
        break;

      case "cardio":
        calories = (duration * 8) + (totalReps * 0.05);
        break;

      case "flexibility":
        calories = (duration * 3.5) + (totalReps * 0.02);
        break;

      case "hiit":
        calories = (duration * 12) + (totalReps * 0.1);
        break;

      default:
        calories = (duration * 5) + (totalReps * 0.05);
        break;
    }

    return Math.round(calories);
  };

  useEffect(() => {
    const { sets, reps, weights, duration, workoutType } = form;

    if (sets && reps && weights && duration && workoutType) {
      const calories = calculateCaloriesBurned(sets, reps, weights, duration, workoutType);
      setForm((prev) => ({
        ...prev,
        caloriesBurned: calories
      }));
    }
  }, [form.sets, form.reps, form.weights, form.duration, form.workoutType]);


  const markComplete = async (workout) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = today.toISOString();

    const updatedWorkout = { ...workout, completed: true };

    try {
      const { data } = await axiosInstance.patch(`/workout/complete/${date}/${workout.workoutType}`);

      console.log(data)
      setWorkoutData((prev) =>
        prev.map((entry) =>
          entry.date === date
            ? {
              ...entry,
              workouts: entry.workouts.map((w) =>
                w.workoutType === workout.workoutType ? updatedWorkout : w
              )
            }
            : entry
        )
      );

      showToastNotification("Workout marked as complete", "success");
    } catch (err) {
      showToastNotification("Failed to update completion status.", "danger");
    }
  };

  const filteredWorkouts = workoutData.filter((workout) => {
    if (filter === "all") return true;
    return filter === "completed" ? workout.completed : !workout.completed;
  });

  const generateRecommendations = () => {
    if (!userData) return ["No user data available."];

    const { fitnessGoal, BMI, dailyCalorieGoal } = userData;
    const recommendations = [];

    if (BMI < 18.5) {
      recommendations.push("You are underweight. Include strength training and a higher-calorie diet.");
    } else if (BMI >= 25) {
      recommendations.push("You are overweight. Prioritize cardio and calorie-burning workouts.");
    } else {
      recommendations.push("You have a healthy BMI. Maintain a balanced workout routine.");
    }

    switch (fitnessGoal) {
      case "weight loss":
        recommendations.push("Focus on cardio and HIIT workouts.");
        recommendations.push(`Aim for at least ${dailyCalorieGoal || 2000} kcal daily burn.`);
        break;
      case "muscle gain":
        recommendations.push("Prioritize strength training with heavier weights and lower reps.");
        recommendations.push("Increase protein intake and aim for progressive overload.");
        break;
      case "endurance":
        recommendations.push("Increase workout duration gradually.");
        recommendations.push("Mix cardio with flexibility exercises for better stamina.");
        break;
      default:
        recommendations.push("Stay consistent with your fitness goals!");
    }

    return recommendations;
  };

  return (
    <div className="py-5 workout-page">
      <div className="workout-overlay"></div>
      <div className="workout-card-wrapper">
        <Row className="text-center mb-5 justify-content-center">
          <Col md={10}>
            <h1 className="display-4 fw-bold text-primary">🏋️‍♂️ Workout Dashboard</h1>
            <p className="lead text-light">
              "Train hard, stay consistent!" <FaDumbbell size={24} color="yellow" />
            </p>
          </Col>
        </Row>

        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ padding: "70px 0" }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <Row className="g-4 justify-content-center">
              <Col md={10}>
                <Card className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff" }}>
                  <Card.Body>
                    <h4 className="mb-3">📊 Personalized Workout Recommendations</h4>
                    {userData ? (
                      <>
                        <p><strong>Fitness Goal:</strong> <span className="text-titlecase">{userData.fitnessGoal}</span></p>
                        <p><strong>BMI:</strong> {userData.BMI}</p>
                        <ListGroup style={{ height: "150px", maxHeight: "150px", overflowY: "auto", overflowX: "hidden" }}>
                          {generateRecommendations().map((rec, index) => (
                            <ListGroup.Item key={index}>
                              {rec}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </>
                    ) : (
                      <p>No user data available.</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 justify-content-center mt-3">
              <Col md={5}>
                <Card className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ height: "550px", maxHeight: "550px", overflowY: "auto", overflowX: "hidden", border: "1px solid #fff" }}>
                  <Card.Body>
                    <h4 className="mb-5">✅ Workout Log</h4>

                    <Form onSubmit={saveWorkout}>
                      <Row className="g-5">
                        <Col md={12}>
                          <Form.Control
                            type="text"
                            name="workoutName"
                            placeholder="Workout Name"
                            value={form.workoutName}
                            onChange={handleChange}
                            minLength="3"
                            maxLength="100"
                            required
                            isInvalid={!!validationErrors.workoutName}
                          />
                          <Form.Control.Feedback type="invalid">{validationErrors.workoutName}</Form.Control.Feedback>
                        </Col>

                        <Col md={6}>
                          <Form.Select
                            name="workoutType"
                            value={form.workoutType}
                            onChange={handleChange}
                            required
                            isInvalid={!!validationErrors.workoutType}
                          >
                            <option value="" disabled>Select Workout Type</option>
                            {Object.keys(workoutTypeColors).map((type) => (
                              <option
                                key={type}
                                value={type}
                                disabled={disbaleWorkoutTypes.includes(type)}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{validationErrors.workoutType}</Form.Control.Feedback>
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            name="duration"
                            placeholder="Duration (mins)"
                            value={form.duration}
                            onChange={handleChange}
                            min="1"
                            max="300"
                            required
                            isInvalid={!!validationErrors.duration}
                          />
                          <Form.Control.Feedback type="invalid">{validationErrors.duration}</Form.Control.Feedback>
                        </Col>

                        <Col md={4}>
                          <Form.Control
                            type="number"
                            name="sets"
                            placeholder="Sets"
                            value={form.sets}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            required
                            isInvalid={!!validationErrors.sets}
                          />
                          <Form.Control.Feedback type="invalid">{validationErrors.sets}</Form.Control.Feedback>
                        </Col>

                        <Col md={4}>
                          <Form.Control
                            type="number"
                            name="reps"
                            placeholder="Reps"
                            value={form.reps}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            required
                            isInvalid={!!validationErrors.reps}
                          />
                          <Form.Control.Feedback type="invalid">{validationErrors.reps}</Form.Control.Feedback>
                        </Col>

                        <Col md={4}>
                          <Form.Control
                            type="number"
                            name="weights"
                            placeholder="Weights (kg)"
                            value={form.weights}
                            onChange={handleChange}
                            min="1"
                            max="1000"
                            required
                            isInvalid={!!validationErrors.weights}
                          />
                          <Form.Control.Feedback type="invalid">{validationErrors.weights}</Form.Control.Feedback>
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            name="caloriesBurned"
                            placeholder="Calories Burned"
                            value={form.caloriesBurned}
                            readOnly
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            placeholder="Trainer"
                            value={userData?.trainerId?.fullName || "No trainer assigned"}
                            readOnly
                          />
                        </Col>

                        <Col md={12} className="mt-5">
                          <Button
                            variant="primary"
                            type="submit"
                            className="w-100"
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save Workout"}
                          </Button>
                        </Col>
                      </Row>
                    </Form>

                  </Card.Body>
                </Card>
              </Col>

              <Col md={5}>
                <Card className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ height: "550px", border: "1px solid #fff" }}>
                  <Card.Body>
                    <h4 className="mb-5">🏋️‍♀️ My Today's Workouts</h4>
                    <Row>
                      <Col className="text-end mb-5">
                        <Dropdown>
                          <Dropdown.Toggle variant="primary">Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}</Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setFilter("all")}>All</Dropdown.Item>
                            <Dropdown.Item onClick={() => setFilter("completed")}>Completed</Dropdown.Item>
                            <Dropdown.Item onClick={() => setFilter("incomplete")}>Incomplete</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                    </Row>

                    <div className="py-3" style={{ height: "350px", maxHeight: "350px", overflowX: "hidden", overflowY: "auto" }}>
                      {filteredWorkouts.length > 0 ? (
                        filteredWorkouts.map((workout) => (
                          <div key={workout.workoutType} className="mb-3">
                            <ListGroup>
                              <ListGroup.Item key={workout._id} className="d-flex justify-content-between align-items-center">
                                <div className="flex-grow-1 pe-3">
                                  <span className="d-flex align-items-center flex-wrap mb-1">
                                    <Badge
                                      bg={workoutTypeColors[workout.workoutType] || "info"}
                                      className="me-2"
                                      style={{
                                        padding: "5px 10px",
                                        fontSize: "0.9rem",
                                        lineHeight: "1.4",
                                      }}
                                    >
                                      {workout.workoutType.charAt(0).toUpperCase() + workout.workoutType.slice(1)}
                                    </Badge>

                                    <strong>{workout.workoutName}</strong>&nbsp;– {workout.sets}x{workout.reps} @ {workout.weights}kg
                                  </span>

                                  <div className="text-muted small">
                                    Duration: {workout.duration} min | Calories: {workout.caloriesBurned}
                                  </div>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  {workout.trainerComment && (
                                    <OverlayTrigger placement="top" overlay={renderTooltip("View Trainer Comment")}>
                                      <Button
                                        variant="info"
                                        size="sm"
                                        style={{ border: "1px solid black" }}
                                        onClick={() => handleTrainerCommentClick(workout.trainerComment)}
                                      >
                                        <MessageSquare size={18} />
                                      </Button>
                                    </OverlayTrigger>
                                  )}

                                  <OverlayTrigger
                                    placement="top"
                                    overlay={renderTooltip(workout.completed ? "Workout Completed" : "Mark as Complete")}
                                  >
                                    <Button
                                      variant={workout.completed ? "light" : "success"}
                                      size="sm"
                                      style={{ border: "1px solid black" }}
                                      onClick={() => markComplete(workout)}
                                      disabled={workout.completed}
                                    >
                                      {workout.completed ? <CheckCheck size={18} /> : <CheckCircle size={18} />}
                                    </Button>
                                  </OverlayTrigger>
                                </div>
                              </ListGroup.Item>
                            </ListGroup>
                          </div>
                        ))
                      ) : (
                        <p className="text-center m-5">No {filter !== "all" ? filter : ""} workouts found.</p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 justify-content-center mt-3">
              <Col md={10}>
                <div className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff" }}>
                  <WorkoutProgressReport />
                </div>
              </Col>
            </Row>
          </>
        )}
      </div>

      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Trainer's Comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{selectedComment}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default Workout;