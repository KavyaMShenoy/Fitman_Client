import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../utils/auth";
import eventEmitter from "../utils/eventEmitter";

import { Row, Col, Card, Form, Button, Spinner, ListGroup, ProgressBar, Alert, Badge, Toast, ToastContainer } from "react-bootstrap";

import NutritionChart from "./NutritionChart";
// import Messenger from "./Messenger";

import '../css/Nutrition.css';

const Nutrition = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);
  const [meals, setMeals] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showToast, setShowToast] = useState({ show: false, message: "", variant: "" });
  const [totalMacros, setTotalMacros] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(0);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(0);
  const [lastSavedIntake, setLastSavedIntake] = useState(0);

  const [form, setForm] = useState({
    mealType: "breakfast",
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fiber: "",
    fats: "",
    description: ""
  });

  const [disabledMealTypes, setDisabledMealTypes] = useState([]);

  const calculateTotalMacros = (meals) => {
    return meals.reduce((acc, meal) => ({
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
      calories: acc.calories + meal.calories
    }), { protein: 0, carbs: 0, fats: 0, calories: 0 });
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
        setDailyCalorieGoal(userResponse?.data?.user?.dailyCalorieGoal);
        setDailyWaterGoal(userResponse?.data?.user?.dailyWaterGoal);
        console.log(userResponse?.data?.user)
      } catch (error) {
        showToastNotification(`❌  Failed to load user data: , ${error.message}`, "danger");
      }
    };

    const fetchNutrition = async () => {
      try {
        const nutritionResponse = await axiosInstance.get("/nutrition");
        const nutritionData = nutritionResponse.data.nutritionEntries[0];
        console.log(nutritionResponse)
        setMeals(nutritionData.meals || []);
        setWaterIntake(nutritionData.waterIntake || 0);
        setLastSavedIntake(nutritionData.waterIntake || 0)
        setTotalMacros(calculateTotalMacros(nutritionData.meals));

        const existingMealTypes = nutritionData.meals.map(meal => meal.mealType);
        setDisabledMealTypes(existingMealTypes);
      } catch (error) {
        showToastNotification(`❌ Failed to load nutrition data: ${error.message}`, "danger");
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUserData(), fetchNutrition()]);
      setIsLoading(false);
    };

    fetchData();

    const handleLogout = () => navigate("/login");
    eventEmitter.on("logout", handleLogout);

    return () => {
      eventEmitter.off("logout", handleLogout);
    };
  }, [userId, navigate]);

  useEffect(() => {
    setTotalMacros(calculateTotalMacros(meals));
  }, [meals]);

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
      mealType: "breakfast",
      foodName: "",
      calories: "",
      protein: "",
      carbs: "",
      fiber: "",
      fats: "",
      description: ""
    });
  };

  const addMeal = async (e) => {
    e.preventDefault();

    const newMeal = {
      ...form,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fiber: parseFloat(form.fiber) || 0,
      fats: parseFloat(form.fats) || 0
    };

    try {
      const nutritionResponse = await axiosInstance.get("/nutrition");
      const nutritionData = nutritionResponse.data.nutritionEntries[0];

      const cleanedMeals = nutritionData?.meals.map(({ _id, ...meal }) => meal) || [];

      const updatedMeals = [...cleanedMeals, newMeal];

      await axiosInstance.post("/nutrition/addNutrition", {
        userId,
        trainerId: userData?.trainerId?._id,
        meals: updatedMeals
      });

      const updatedResponse = await axiosInstance.get("/nutrition");
      const updatedNutritionData = updatedResponse.data.nutritionEntries[0];

      setMeals(updatedNutritionData.meals || []);

      setTotalMacros(calculateTotalMacros(updatedMeals));

      const existingMealTypes = updatedNutritionData.meals.map(meal => meal.mealType);
      setDisabledMealTypes(existingMealTypes);

      showToastNotification("✅ Meal saved successfully!", "success");

    } catch (error) {
      showToastNotification(`❌ Failed to save meal: ${error.message}`, "danger");
    }

    resetForm();
  };

  const saveWaterIntake = async () => {
    try {
      await axiosInstance.patch("/nutrition/updateWaterIntake", { userId, waterIntake });
      showToastNotification("✅ Water intake saved successfully!", "success");
    } catch (error) {
      showToastNotification(`❌ Failed to save water intake: ${error.message}`, "danger");
    }
    setLastSavedIntake(waterIntake);
  };

  const generateNutritionRecommendations = () => {
    if (!userData) return ["No user data available."];

    const { fitnessGoal, BMI, dailyCalorieGoal, dailyWaterGoal } = userData;

    const totalCaloriesConsumed = meals.reduce((total, meal) => total + meal.calories, 0);
    const calorieDeficit = dailyCalorieGoal - totalCaloriesConsumed;

    const recommendations = [];

    if (BMI < 18.5) {
      recommendations.push("You are underweight. Consider increasing calorie intake and adding more healthy fats.");
    } else if (BMI >= 25) {
      recommendations.push("You are overweight. Focus on reducing carbs and fats, and increase fiber intake.");
    } else {
      recommendations.push("You have a healthy BMI. Maintain a balanced nutrient distribution.");
    }

    switch (fitnessGoal) {
      case "weight loss":
        recommendations.push("Create a calorie deficit by consuming fewer calories than you burn.");
        recommendations.push(`Target ${Math.max(calorieDeficit, 0)} kcal deficit today.`);
        recommendations.push("Prioritize lean proteins and reduce refined carbs.");
        break;
      case "muscle gain":
        recommendations.push("Increase protein intake and aim for a calorie surplus.");
        recommendations.push("Consume more complex carbs and healthy fats.");
        recommendations.push("Add resistance training exercises to support muscle growth.");
        break;
      case "maintenance":
        recommendations.push("Balance calorie intake and expenditure to maintain your current weight.");
        recommendations.push("Ensure a diverse nutrient intake for overall health.");
        break;
      default:
        recommendations.push("Stay consistent with your nutrition plan!");
    }

    if (waterIntake < dailyWaterGoal) {
      recommendations.push(`Increase water intake: Drink at least ${dailyWaterGoal} glasses daily.`);
    } else {
      recommendations.push("You are meeting your water intake goal. Keep it up!");
    }

    return recommendations;
  };

  const isMealFormValid = form.foodName && form.calories;

  return (
    <div className="py-5 nutrition-page">

      <div className="nutrition-overlay"></div>

      <div className="nutrition-card-wrapper">
        <Row className="text-center mb-5 justify-content-center">
          <Col md={10}>
            <h1 className="display-4 fw-bold text-success">🥗 Nutrition Dashboard</h1>
            <p className="lead text-light">"Fuel your body with the right nutrition!" 🍎</p>
          </Col>
        </Row>

        {isLoading ?
          (<div className="mt-5 d-flex justify-content-center align-items-center" style={{ padding: '70px 0' }}>
            <Spinner animation="border" variant="primary" />
            <div className="mt-2 text-primary">Loading...</div>
          </div>) :
          (<>
            <Row className="g-4 justify-content-center">
              <Col md={10}>
                <Card className="shadow-lg rounded-3 border-0 p-4 bg-dark bg-opacity-75 text-light">
                  <Card.Body>
                    <h4>🥗 Personalized Nutrition Recommendations</h4>
                    {userData ? (
                      <>
                        <p><strong>Goal:</strong> {userData.fitnessGoal}</p>
                        <p><strong>BMI:</strong> {userData.BMI}</p>
                        <p><strong>Daily Calorie Goal:</strong> {userData.dailyCalorieGoal} kcal</p>
                        <p><strong>Daily Water Goal:</strong> {userData.dailyWaterGoal} glasses</p>

                        <ListGroup style={{ height: "200px", maxHeight: "200px", overflowY: "auto", overflowX: "hidden" }}>
                          {generateNutritionRecommendations().map((rec, index) => (
                            <ListGroup.Item key={index}>
                              {rec}
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </>
                    ) : (
                      <p>Loading user data...</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4 justify-content-center mt-3">
              <Col md={5}>
                <Card className="shadow-lg rounded-3 border-0 p-4 bg-dark bg-opacity-75 text-light">
                  <Card.Body>
                    <h4 className="mb-4">🍽️ Meal Log</h4>

                    <Form onSubmit={addMeal}>
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Meal Type</Form.Label>
                            <Form.Select
                              name="mealType"
                              value={form.mealType}
                              onChange={handleChange}
                              required
                            >
                              {["breakfast", "lunch", "dinner", "snack"].map(type => (
                                <option key={type} value={type} disabled={disabledMealTypes.includes(type)}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Food Name</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Food Name"
                              name="foodName"
                              value={form.foodName}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            placeholder="Calories"
                            name="calories"
                            value={form.calories}
                            onChange={handleChange}
                            min="1"
                            required
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            placeholder="Fiber (g)"
                            name="fiber"
                            value={form.fiber}
                            onChange={handleChange}
                            min="0"
                          />
                        </Col>

                        <Col md={4}>
                          <Form.Control
                            type="number"
                            placeholder="Protein (g)"
                            name="protein"
                            value={form.protein}
                            onChange={handleChange}
                            min="0"
                          />
                        </Col>

                        <Col md={4}>
                          <Form.Control
                            type="number"
                            placeholder="Carbs (g)"
                            name="carbs"
                            value={form.carbs}
                            onChange={handleChange}
                            min="0"
                          />
                        </Col>

                        <Col md={4}>
                          <Form.Control
                            type="number"
                            placeholder="Fats (g)"
                            name="fats"
                            value={form.fats}
                            onChange={handleChange}
                            min="0"
                          />
                        </Col>

                        <Col md={12}>
                          <Form.Control
                            type="textarea"
                            placeholder="Description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            maxLength="300"
                          />
                        </Col>

                        <Col md={12}>
                          <Button type="submit" variant="success" className="mt-2 w-100" disabled={!isMealFormValid}>
                            Save Meal
                          </Button>
                        </Col>
                      </Row>
                    </Form>

                    <div className="mt-4" style={{ height: "250px", maxHeight: "250px", overflow: "auto" }}>
                      <ListGroup>
                        {meals.length > 0 ? (
                          meals.map((meal) => (
                            <ListGroup.Item key={meal._id}>
                              <strong>{meal.foodName}</strong>
                              <Badge bg="info" className="ms-2">{meal.mealType}</Badge>
                              <div>Calories: {meal.calories} kcal</div>
                              <small className="text-muted">
                                Protein: {meal.protein}g, Carbs: {meal.carbs}g, Fiber: {meal.fiber}g, Fats: {meal.fats}g
                              </small>
                              {meal.description && <div>Description: {meal.description}</div>}
                            </ListGroup.Item>
                          ))
                        ) : (
                          <Alert variant="info">No meals added yet!</Alert>
                        )}
                      </ListGroup>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={5}>
                <Card className="shadow-lg rounded-3 border-0 p-4 bg-dark bg-opacity-75 text-light">
                  <Card.Body className="text-center">
                    <h4>🔥 Calorie Breakdown</h4>
                    <NutritionChart
                      totalMacros={totalMacros}
                      dailyCalorieGoal={dailyCalorieGoal}
                      waterIntake={waterIntake}
                      dailyWaterGoal={dailyWaterGoal}
                    />

                  </Card.Body>
                </Card>

                <Card className="shadow-lg mt-4">
                  <Card.Body>
                    <h4>💧 Water Intake Tracker</h4>
                    <ProgressBar
                      now={(waterIntake / dailyWaterGoal) * 100}
                      label={`${waterIntake}/${dailyWaterGoal} Glasses`}
                      animated
                    />
                    <div className="d-flex justify-content-between mt-3">
                      <Button
                        variant="primary"
                        onClick={() => setWaterIntake((prev) => Math.min(prev + 1, dailyWaterGoal))}
                      >
                        + Add Glass
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setWaterIntake((prev) => Math.max(prev - 1, 0))}
                      >
                        - Remove Glass
                      </Button>
                    </div>
                    <Button
                      variant="success"
                      className="mt-3 w-100"
                      onClick={saveWaterIntake}
                      disabled={waterIntake === lastSavedIntake}
                    >
                      Save Water Intake
                    </Button>
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


        {/* {userId && userData && (
        <Messenger
          trainerId={userData?.trainerId?._id}
          userId={userId}
        />
      )} */}
      </div>

    </div>
  );
};

export default Nutrition;