import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../utils/auth";
import eventEmitter from "../utils/eventEmitter";

import { Row, Col, Card, ListGroup, Form, Button, Spinner, Toast, ToastContainer, Dropdown } from "react-bootstrap";

import '../css/Workout.css';

const Workout = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: "", variant: "" });
  const [filter, setFilter] = useState("all");

  const getWorkoutId = (workout) => workout._id || workout.id;

  const [form, setForm] = useState({
    userId: "",
    trainerId: "",
    workoutName: "",
    workoutType: "strength",
    duration: "",
    caloriesBurned: "",
    sets: "",
    reps: "",
    weights: ""
  });

  const workoutColors = {
    strength: "primary",
    cardio: "warning",
    flexibility: "success",
    HIIT: "danger"
  };

  useEffect(() => {
    const fetchUserId = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          showToastNotification("❌ Token missing.", "danger");
          navigate("/login");
          return;
        }
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.userId);
      } catch (error) {
        showToastNotification(`❌ Invalid token or decoding failed: ${error.message}`, "danger");
        navigate("/login");
      }
    };

    fetchUserId();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const userResponse = await axiosInstance.get(`/auth/profile/${userId}`);
        setUserData(userResponse?.data?.user);
        console.log(userResponse?.data?.user)
        setForm((prevForm) => ({
          ...prevForm,
          userId: userId,
          trainerId: userResponse?.data?.user?.trainerId?._id
        }));
      } catch (error) {
        showToastNotification(`❌  Failed to load user data: ${error.message}`, "danger");
      }
    };

    const fetchWorkouts = async () => {
      try {
        const workoutResponse = await axiosInstance.get("/workout");
        const backendWorkouts = workoutResponse?.data?.workouts || [];

        const combinedWorkouts = backendWorkouts.map((workout) => ({
          ...workout
        }));

        setWorkouts(combinedWorkouts);
      } catch (error) {
        showToastNotification(`❌ Failed to load workouts: ${error.message}`, "danger");
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

  const showToastNotification = (message, variant) => {
    setShowToast({ show: true, message, variant });
  };

  useEffect(() => {
    if (showToast.show) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const resetForm = () => {
    setForm({
      userId: userId,
      trainerId: "",
      workoutName: "",
      workoutType: "strength",
      duration: "",
      caloriesBurned: "",
      sets: "",
      reps: "",
      weights: ""
    });
  };

  const isValidForm = () => {
    const { workoutName, duration, caloriesBurned, sets, reps, weights } = form;
    return (
      workoutName.trim() &&
      duration >= 1 && duration <= 300 &&
      caloriesBurned >= 1 && caloriesBurned <= 5000 &&
      sets >= 1 && reps >= 1 && weights >= 1
    );
  };

  const addWorkout = async (e) => {
    e.preventDefault();

    if (!isValidForm()) {
      showToastNotification("⚠️ Please fill out all fields with valid values.", "warning");
      return;
    }

    const newWorkout = {
      ...form,
      duration: parseInt(form.duration),
      caloriesBurned: parseInt(form.caloriesBurned),
      sets: parseInt(form.sets),
      reps: parseInt(form.reps),
      weights: parseInt(form.weights),
      completed: false
    };

    setWorkouts((prev) => [...prev, newWorkout]);

    try {
      setIsSaving(true);
      await axiosInstance.post("/workout/create", { workouts: [newWorkout] });
      showToastNotification("✅ Workout added successfully!", "success");
      resetForm();
    } catch (error) {
      showToastNotification(`❌ Failed to load workouts: ${error.message}`, "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const markWorkoutComplete = async (workout) => {
    const updatedWorkout = { ...workout, completed: !workout.completed };

    setWorkouts((prev) =>
      prev.map((w) =>
        getWorkoutId(w) === getWorkoutId(workout) ? updatedWorkout : w
      )
    );

    try {
      await axiosInstance.patch(`/workout/complete/${workout._id}`, {
        completed: updatedWorkout.completed
      });
      showToastNotification(
        `✅ Workout marked as ${updatedWorkout.completed ? "complete" : "incomplete"}`,
        "success"
      );
    } catch (error) {
      showToastNotification(`❌ Failed to update completion status : ${error.message}`, "danger");
    }
  };

  const filteredWorkouts = workouts.filter((workout) => {
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
            <p className="lead text-light">"Train hard, stay consistent!" 💪</p>
          </Col>
        </Row>

        {isLoading ? (
          <div className="mt-5 d-flex justify-content-center align-items-center" style={{ padding: '70px 0' }}>
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-primary">Loading...</div>
          </div>
        ) : (
          <>
            <Row className="g-4 justify-content-center">
              <Col md={10}>
                <Card className="shadow-lg rounded-3 border-0 p-4 bg-dark bg-opacity-75 text-light">
                  <Card.Body>
                    <h4>📊 Personalized Workout Recommendations</h4>
                    {userData ? (
                      <>
                        <p><strong>Fitness Goal:</strong> {userData.fitnessGoal}</p>
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
                <Card className="shadow-lg rounded-3 border-0 p-4  bg-dark bg-opacity-75 text-light">
                  <Card.Body>
                    <h4>✅ Log Your Workout</h4>
                    <Form onSubmit={addWorkout}>
                      <Form.Control type="hidden" name="userId" value={form.userId} />
                      <Form.Group className="mb-3">
                        <Form.Label>Workout Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="workoutName"
                          value={form.workoutName}
                          onChange={handleChange}
                          placeholder="e.g., Push-ups"
                          required
                        />
                      </Form.Group>
                      <Row className="g-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Workout Type</Form.Label>
                            <Form.Select
                              name="workoutType"
                              value={form.workoutType}
                              onChange={handleChange}
                            >
                              {Object.keys(workoutColors).map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group>
                            <Form.Label>Duration (mins)</Form.Label>
                            <Form.Control
                              type="number"
                              name="duration"
                              value={form.duration}
                              onChange={handleChange}
                              min="1"
                              max="300"
                              placeholder="e.g., 60"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row className="g-3 mt-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Calories Burned</Form.Label>
                            <Form.Control
                              type="number"
                              name="caloriesBurned"
                              value={form.caloriesBurned}
                              onChange={handleChange}
                              min="1"
                              max="5000"
                              placeholder="e.g., 400"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group>
                            <Form.Label>Trainer ID</Form.Label>
                            <Form.Control
                              type="text"
                              name="trainerId"
                              value={userData?.trainerId?.fullName || "No trainer assigned"}
                              onChange={handleChange}
                              placeholder="Trainer ID"
                              disabled
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row className="g-3 mt-3">
                        <Col>
                          <Form.Group>
                            <Form.Label>Sets</Form.Label>
                            <Form.Control
                              type="number"
                              name="sets"
                              value={form.sets}
                              onChange={handleChange}
                              min="1"
                              max="10"
                              placeholder="e.g., 3"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group>
                            <Form.Label>Reps</Form.Label>
                            <Form.Control
                              type="number"
                              name="reps"
                              value={form.reps}
                              onChange={handleChange}
                              min="1"
                              max="30"
                              placeholder="e.g., 12"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group>
                            <Form.Label>Weights (kg)</Form.Label>
                            <Form.Control
                              type="number"
                              name="weights"
                              value={form.weights}
                              onChange={handleChange}
                              min="1"
                              max="200"
                              placeholder="e.g., 50"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button variant="primary" type="submit" className="mt-3 w-100" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Workout"}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={5}>
                <Card className="shadow-lg rounded-3 border-0 p-4 bg-dark bg-opacity-75 text-light" style={{ height: "530px", maxHeight: "530px", overflow: "hidden" }}>
                  <Card.Body>
                    <h4>🏋️‍♀️ Your Workouts</h4>
                    <Row>
                      <Col className="text-end mb-3">
                        <Dropdown>
                          <Dropdown.Toggle variant="primary">Filter: {filter}</Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setFilter("all")}>All</Dropdown.Item>
                            <Dropdown.Item onClick={() => setFilter("completed")}>Completed</Dropdown.Item>
                            <Dropdown.Item onClick={() => setFilter("incomplete")}>Incomplete</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </Col>
                    </Row>

                    <ListGroup style={{ height: "360px", maxHeight: "360px", overflowY: "auto", overflowX: "hidden" }}>
                      {(filteredWorkouts.length > 0) && (filteredWorkouts.map((workout) => (
                        <ListGroup.Item key={getWorkoutId(workout)} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{workout.workoutName}</strong> - {workout.sets} sets x {workout.reps} reps @ {workout.weights} kg
                            <br /> Duration: {workout.duration} min | Calories: {workout.caloriesBurned} kcal | Trainer: {workout.trainerId || 'NA'}
                          </div>

                          <Button
                            variant={workout.completed ? "light" : "success"}
                            onClick={() => markWorkoutComplete(workout)}
                            className="float-end">
                            {workout.completed ? "Undo" : "Complete"}
                          </Button>
                        </ListGroup.Item>
                      )))}
                      {
                        (filteredWorkouts.length === 0) && (<span className="text-center mt-5">{filter !== 'all' ? `No ${filter} workouts.` : `No workouts.`}</span>)
                      }
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {showToast.show && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999
            }}
          />
        )}

        {showToast.show && (
          <ToastContainer
            position="middle-center"
            className="p-3"
            style={{ zIndex: 1001, position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <Toast
              show={showToast.show}
              bg={showToast.variant}
              onClose={() => setShowToast({ ...showToast, show: false })}
              delay={3000}
              autohide
            >
              <Toast.Header>
                <strong className="me-auto">Notification</strong>
                <small>Just now</small>
              </Toast.Header>
              <Toast.Body>{showToast.message}</Toast.Body>
            </Toast>
          </ToastContainer>
        )}

      </div>

    </div>
  );
};

export default Workout;