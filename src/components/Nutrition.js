import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import axiosInstance from "../utils/auth";
import eventEmitter from "../utils/eventEmitter";

import { Row, Col, Card, Table, Form, Button, Spinner, ListGroup, ProgressBar, Badge, Modal } from "react-bootstrap";

import NutritionChart from "./NutritionChart";
import NutritionTimeline from "./NutritionTimeline";

import { BsChatDotsFill } from 'react-icons/bs';
import { FaAppleAlt } from 'react-icons/fa';

import '../css/Nutrition.css';

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/GlobalToastContext";

const Nutrition = () => {
  const navigate = useNavigate();

  const { userId, trainerId } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [meals, setMeals] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [totalMacros, setTotalMacros] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(0);
  const { showToastNotification } = useToast();
  const [dailyWaterGoal, setDailyWaterGoal] = useState(0);
  const [lastSavedIntake, setLastSavedIntake] = useState(0);

  const [form, setForm] = useState({
    mealType: "",
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fiber: "",
    fats: "",
    description: ""
  });

  const [disabledMealTypes, setDisabledMealTypes] = useState([]);

  const mealTypeColors = {
    breakfast: "warning",
    lunch: "success",
    dinner: "primary",
    snack: "secondary"
  };

  const calculateMealCalories = (protein = 0, carbs = 0, fats = 0, fiber = 0) => {
    const proteinCalories = protein * 4;
    const carbsCalories = carbs * 4;
    const fatsCalories = fats * 9;
    const fiberCalories = fiber * 2;

    const totalCalories = proteinCalories + carbsCalories + fatsCalories + fiberCalories;

    return Math.round(totalCalories);
};

useEffect(() => {
  const { protein, carbs, fats, fiber } = form;
  if (protein !== null && carbs !== null && fats !== null && fiber !== null) {
    const calories = calculateMealCalories(protein, carbs, fats, fiber);
    setForm((prev) => ({
      ...prev,
      calories,
    }));
  }
}, [form.protein, form.carbs, form.fats, form.fiber]);

  const calculateTotalMacros = (meals) => {
    return meals.reduce((acc, meal) => ({
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
      calories: acc.calories + meal.calories
    }), { protein: 0, carbs: 0, fats: 0, calories: 0 });
  };

  const [showDescModal, setShowDescModal] = useState(false);
  const [fullDesc, setFullDesc] = useState("");

  const handleShowFullDescription = (desc) => {
    setFullDesc(desc);
    setShowDescModal(true);
  };

  const handleCloseDescModal = () => {
    setShowDescModal(false);
    setFullDesc("");
  };

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [trainerComment, setTrainerComment] = useState("");

  const handleShowTrainerComment = (comment) => {
    setTrainerComment(comment);
    setShowCommentModal(true);
  };

  const handleCloseTrainerComment = () => {
    setShowCommentModal(false);
    setTrainerComment("");
  };

  useEffect(() => {
    if (!userId) return;

    const getLocalDateString = (isoDate) => {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-CA');
    };

    const fetchUserData = async () => {
      try {
        const { data } = await axiosInstance.get(`/auth/profile/${userId}`);
        const user = data?.user;
        setUserData(user);
        setDailyCalorieGoal(user?.dailyCalorieGoal);
        setDailyWaterGoal(user?.dailyWaterGoal);
        console.log(user);
      } catch (error) {
        showToastNotification("Failed to load user data.", "danger");
      }
    };

    const fetchNutrition = async () => {
      try {
        const { data } = await axiosInstance.get("/nutrition/today");
        const todayNutritionData = data?.nutritionEntry;
        console.log(data);

        const mealEntries = todayNutritionData?.mealEntries || [];
        const water = todayNutritionData?.waterIntake || 0;

        setMeals(mealEntries);
        setWaterIntake(water);
        setLastSavedIntake(water);

        setDisabledMealTypes(mealEntries.map(meal => meal.mealType));
        setTotalMacros(calculateTotalMacros(mealEntries));
      } catch (error) {
        showToastNotification("Error fetching nutrition data.", "danger");
      }
    };

    const fetchAllNutritionData = async () => {
      try {
        const { data } = await axiosInstance.get("/nutrition/all");
        if (data?.success) {
          const today = getLocalDateString(new Date());

          const filteredEntries = (data.nutritionEntries || []).filter(entry => {
            return getLocalDateString(entry.date) !== today;
          });

          setTimelineData(filteredEntries);
        }
      } catch (error) {
        console.error("Failed to fetch nutrition data", error);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUserData(),
        fetchNutrition(),
        fetchAllNutritionData()
      ]);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["protein", "carbs", "fats", "fiber"];
    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const resetForm = () => {
    setForm({
      mealType: "",
      foodName: "",
      calories: "",
      protein: "",
      carbs: "",
      fiber: "",
      fats: "",
      description: ""
    });
  };

  const saveMeal = async (e) => {
    e.preventDefault();

    if (!isValidForm()) {
      showToastNotification("Please fill all fields with valid values.", "warning");
      return;
    }

    const newMeal = {
      mealType: form.mealType,
      foodName: form.foodName.trim(),
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fiber: parseFloat(form.fiber) || 0,
      fats: parseFloat(form.fats) || 0,
      description: form.description?.trim() || ""
    };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const payload = {
        userId,
        trainerId: trainerId,
        date: today.toISOString(),
        meal: newMeal
      };

      await axiosInstance.post("/nutrition/addNutrition", payload);

      const { data } = await axiosInstance.get("/nutrition/today");
      console.log(data, 123)

      setMeals(data?.nutritionEntry?.mealEntries || []);
      setTotalMacros(calculateTotalMacros(data?.nutritionEntry?.mealEntries || []));

      const existingMealTypes = data.nutritionEntry?.mealEntries?.map(meal => meal.mealType);
      setDisabledMealTypes(existingMealTypes || []);

      showToastNotification("Meal saved successfully!", "success");
      resetForm();
    } catch (error) {
      showToastNotification("Failed to save meal.", "danger");
    }
  };

  const saveWaterIntake = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = today.toISOString();

      await axiosInstance.patch("/nutrition/updateWaterIntake", { date, waterIntake });

      showToastNotification("Water intake saved successfully!", "success");
      setLastSavedIntake(waterIntake);
    } catch (error) {
      showToastNotification("Failed to save water intake.", "danger");
    }
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

  const isValidForm = () => {
    const { foodName, calories, protein, carbs, fiber, fats, description } = form;
    return (
      foodName.trim() && foodName.length >= 3 && foodName.length <= 300 &&
      calories >= 1 && calories <= 5000 &&
      protein >= 1 && protein <= 500 &&
      carbs >= 1 && carbs <= 1000 &&
      fiber >= 1 && fiber <= 100 &&
      fats >= 1 && fats <= 300 &&
      description >= 500
    );
  };

  return (
    <div className="py-5 nutrition-page">

      <div className="nutrition-overlay"></div>

      <div className="nutrition-card-wrapper">
        <Row className="text-center mb-5 justify-content-center">
          <Col md={10}>
            <h1 className="display-4 fw-bold text-success">🥗 Nutrition Dashboard</h1>
            <p className="lead text-light">"Fuel your body with the right nutrition!" <FaAppleAlt size={28} color="#e11d48" /> </p>
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
                <Card className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff" }}>
                  <Card.Body>
                    <h4 className="mb-3">🥗 Personalized Nutrition Recommendations</h4>
                    {userData ? (
                      <>
                        <p><strong>Goal:</strong> <span className="text-titlecase">{userData.fitnessGoal}</span></p>
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
                <Card className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff",height: "792px", maxHeight: "792px", overflowY: "auto", overflowX: "hidden" }}>
                  <Card.Body>
                    <h4 className="mb-5">🍽️ Meal Log</h4>

                    <Form onSubmit={saveMeal}>
                      <Row className="g-5">
                        <Col md={12}>
                          <Form.Control
                            type="text"
                            placeholder="Food Name"
                            name="foodName"
                            value={form.foodName}
                            onChange={handleChange}
                            minLength="3"
                            maxLength="100"
                            required
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Select
                            name="mealType"
                            value={form.mealType}
                            onChange={handleChange}
                            required
                          >
                            <option value="" disabled>Select Meal Type</option>
                            {Object.keys(mealTypeColors).map((type) => (
                              <option key={type} value={type} disabled={disabledMealTypes.includes(type)}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            name="calories"
                            placeholder="Calories"
                            value={form.calories}
                            readOnly
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            placeholder="Protein (g)"
                            name="protein"
                            value={form.protein}
                            onChange={handleChange}
                            min="0"
                            max="500"
                            required
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            placeholder="Carbs (g)"
                            name="carbs"
                            value={form.carbs}
                            onChange={handleChange}
                            min="0"
                            max="1000"
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
                            max="100"
                            required
                          />
                        </Col>

                        <Col md={6}>
                          <Form.Control
                            type="number"
                            placeholder="Fats (g)"
                            name="fats"
                            value={form.fats}
                            onChange={handleChange}
                            min="0"
                            max="300"
                            required
                          />
                        </Col>

                        <Col md={12}>
                          <Form.Control
                            as="textarea"
                            placeholder="Description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            maxLength="500"
                            className="rounded-3 p-2 no-resize-scroll"
                          />
                        </Col>

                        <Col md={12}>
                          <Button type="submit" variant="success" className="mt-2 w-100">
                            Save Meal
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={5}>
                <Card className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff" }}>
                  <Card.Body className="text-center">
                    <h4 className="mb-3">🔥 Calorie Breakdown</h4>
                    <NutritionChart
                      totalMacros={totalMacros}
                      dailyCalorieGoal={dailyCalorieGoal}
                      waterIntake={waterIntake}
                      dailyWaterGoal={dailyWaterGoal}
                    />

                  </Card.Body>
                </Card>

                <Card className="mt-4 shadow-lg rounded-3 p-1 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff", height: "260px", maxHeight: "260px", overflowY: "auto", overflowX: "hidden" }}>
                  <Card.Body>
                    <h4 className="mb-3">💧 Water Intake Tracker</h4>
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
                      className="mt-5 w-100"
                      onClick={saveWaterIntake}
                      disabled={waterIntake === lastSavedIntake}
                    >
                      Save Water Intake
                    </Button>
                  </Card.Body>
                </Card>

              </Col>
            </Row>

            <Row className="g-4 justify-content-center mt-3">
              <Col md={10}>
                <div
                  className="rounded-4 shadow-sm p-3"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid #fff",
                  }}
                >
                  <h4 className="text-center mb-3 fw-semibold text-light">Today's Meal Log</h4>

                  <Table
                    bordered
                    responsive
                    className="table-sm rounded-4 overflow-hidden m-0 transparent-table"
                  >
                    <thead className="text-center text-white">
                      <tr>
                        <th>#</th>
                        <th>Meal Type</th>
                        <th>Food</th>
                        <th>Calories</th>
                        <th>Protein (g)</th>
                        <th>Carbs (g)</th>
                        <th>Fats (g)</th>
                        <th>Fiber (g)</th>
                        <th>Description</th>
                        <th>Trainer Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meals && meals.length > 0 ? (
                        meals.map((meal, index) => (
                          <tr key={index} className="text-white">
                            <td className="text-center">{index + 1}</td>
                            <td className="text-center">
                              <Badge bg={mealTypeColors[meal.mealType] || "info"} style={{ padding: "5px 10px", fontSize: "0.9rem", lineHeight: "1.4" }}>
                                {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                              </Badge>
                            </td>
                            <td>{meal.foodName}</td>
                            <td>{meal.calories}</td>
                            <td>{meal.protein}</td>
                            <td>{meal.carbs}</td>
                            <td>{meal.fats}</td>
                            <td>{meal.fiber}</td>
                            <td style={{ maxWidth: "150px", whiteSpace: "normal", wordWrap: "break-word" }}>
                              {meal.description ? (
                                <>
                                  {meal.description.split(" ").slice(0, 30).join(" ")}
                                  {meal.description.split(" ").length > 30 && (
                                    <span
                                      role="button"
                                      className="text-primary ms-2 text-decoration-underline"
                                      onClick={() => handleShowFullDescription(meal.description)}
                                    >
                                      Show more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <em className="text-light">—</em>
                              )}
                            </td>
                            <td>
                              {meal.trainerComment ? (
                                <span
                                  role="button"
                                  className="text-primary d-flex justify-content-center m-3"
                                  onClick={() => handleShowTrainerComment(meal.trainerComment)}
                                  title="View trainer comment"
                                >
                                  <BsChatDotsFill size={18} className="text-light" />
                                </span>
                              ) : (
                                <span className="d-flex justify-content-center"><em className="text-light">No comment</em></span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center text-light">
                            No meals logged for today.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Col>
            </Row>

            <Row className="g-4 justify-content-center mt-3">
              <Col md={10}>
                <div className="shadow-lg rounded-3 p-4 bg-dark bg-opacity-75 text-light" style={{ border: "1px solid #fff" }}>
                  <h4 className="text-center mb-3 fw-semibold text-light">🕒 Nutrition Timeline History (Last 5 Days)</h4>
                  {timelineData.length > 0 ? (<NutritionTimeline nutritionEntries={timelineData} />) :
                    <div className="text-center bg-light text-dark rounded p-5 fw-bold">No timelines.</div>}
                </div>
              </Col>
            </Row>
          </>
          )}

        <Modal show={showDescModal} onHide={handleCloseDescModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Meal Description</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ whiteSpace: "pre-wrap" }}>
            {fullDesc}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseDescModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showCommentModal} onHide={handleCloseTrainerComment} centered>
          <Modal.Header closeButton>
            <Modal.Title>Trainer Comment</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
            {
              trainerComment.split(" ").slice(0, 300).join(" ") +
              (trainerComment.split(" ").length > 300 ? "..." : "")
            }
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseTrainerComment}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

    </div>
  );
};

export default Nutrition;