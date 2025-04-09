import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList
} from "recharts";
import axiosInstance from "../utils/auth";
import moment from "moment";
import { Card, Form, Row, Col, Spinner, OverlayTrigger, Tooltip as RBTooltip } from "react-bootstrap";

const WorkoutProgressReport = () => {
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("caloriesBurned");
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const metricsMap = {
    caloriesBurned: "Calories Burned",
    duration: "Duration (min)",
    sets: "Total Sets",
    reps: "Total Reps",
    weights: "Total Weights",
  };

  const barColors = {
    caloriesBurned: "#f87171",
    duration: "#60a5fa",
    sets: "#34d399",
    reps: "#facc15",
    weights: "#a78bfa",
  };

  const getCompletionColor = (rate) => {
    if (rate >= 80) return "text-success";
    if (rate >= 50) return "text-warning";
    return "text-danger";
  };

  useEffect(() => {
    const fetchWorkoutData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/workout/all");
        const allEntries = res.data.workoutEntries || [];

        const last7Days = [...Array(7)].map((_, i) =>
          moment().subtract(6 - i, "days").format("YYYY-MM-DD")
        );

        const dataMap = {};
        let totalCalories = 0,
          totalDuration = 0,
          completedWorkouts = 0,
          totalWorkouts = 0;

        last7Days.forEach(date => {
          dataMap[date] = {
            date,
            caloriesBurned: 0,
            duration: 0,
            sets: 0,
            reps: 0,
            weights: 0,
            completed: 0,
            total: 0,
          };
        });

        allEntries.forEach(entry => {
          const date = moment(entry.date).format("YYYY-MM-DD");
          if (dataMap[date]) {
            entry.workouts.forEach(w => {
              if (onlyCompleted && !w.completed) return;

              dataMap[date].caloriesBurned += w.caloriesBurned || 0;
              dataMap[date].duration += w.duration || 0;
              dataMap[date].sets += w.sets || 0;
              dataMap[date].reps += w.reps || 0;
              dataMap[date].weights += w.weights || 0;

              dataMap[date].total += 1;
              if (w.completed) dataMap[date].completed += 1;

              totalCalories += w.caloriesBurned || 0;
              totalDuration += w.duration || 0;
              totalWorkouts += 1;
              if (w.completed) completedWorkouts += 1;
            });
          }
        });

        const formattedData = last7Days.map(date => ({
          ...dataMap[date],
          label: moment(date).format("ddd"),
        }));

        setChartData(formattedData);

        setSummary({
          totalCalories,
          totalDuration,
          totalWorkouts,
          completedWorkouts,
          completionRate: totalWorkouts ? ((completedWorkouts / totalWorkouts) * 100).toFixed(1) : 0,
        });
      } catch (error) {
        console.error("Failed to fetch workout report", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [selectedMetric, onlyCompleted]);

  const hasData = chartData.some(day => day[selectedMetric] > 0);
  const avgPerDay = hasData ? (chartData.reduce((acc, cur) => acc + cur[selectedMetric], 0) / 7).toFixed(1) : 0;

  return (
    <div
      className="p-3 rounded"
      style={{
        background: "linear-gradient(to right, #1e3c72, #2a5298)",
        minHeight: "100%",
        color: "#fff",
      }}
    >
      <h4 className="text-center mb-4 fw-semibold text-light">Workout Progress (Last 7 Days)</h4>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="light" />
          <p className="mt-2">Loading workout data...</p>
        </div>
      ) : summary && hasData ? (
        <>
          <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#1f2937", color: "#f9fafb" }}>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <Form.Group controlId="metricSelect">
                    <Form.Label>Select Metric</Form.Label>
                    <Form.Select
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value)}
                      className="bg-dark text-white"
                    >
                      {Object.keys(metricsMap).map((metric) => (
                        <option key={metric} value={metric}>
                          {metricsMap[metric]}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3 mt-md-0">
                  <Form.Check
                    type="switch"
                    id="onlyCompletedSwitch"
                    label="Show only completed workouts"
                    checked={onlyCompleted}
                    onChange={() => setOnlyCompleted(prev => !prev)}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4 shadow" style={{ backgroundColor: "#111827", color: "#f9fafb" }}>
            <Card.Body>
              <Row>
                <Col sm={6} md={3}><strong>Total Workouts:</strong> {summary.totalWorkouts}</Col>
                <Col sm={6} md={3}><strong>Total Calories:</strong> {summary.totalCalories} kcal</Col>
                <Col sm={6} md={3}><strong>Total Duration:</strong> {summary.totalDuration} mins</Col>
                <Col sm={6} md={3}>
                  <strong>Completion Rate:</strong>{" "}
                  <OverlayTrigger
                    overlay={<RBTooltip>{`${summary.completedWorkouts} / ${summary.totalWorkouts} completed`}</RBTooltip>}
                  >
                    <span className={getCompletionColor(summary.completionRate)}>
                      {summary.completionRate}%
                    </span>
                  </OverlayTrigger>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={chartData}
              barCategoryGap={20}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
              <Legend />
              <Bar
                dataKey={selectedMetric}
                name={metricsMap[selectedMetric]}
                fill={barColors[selectedMetric]}
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                <LabelList dataKey={selectedMetric} position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <p className="text-center mt-3 text-sm text-light">
            Avg {metricsMap[selectedMetric]} per day: <strong>{avgPerDay}</strong>
          </p>
        </>
      ) : (
        <Card className="text-center p-4 shadow-sm bg-dark text-light">
          <h5>No workout data available for the past 7 days.</h5>
          {onlyCompleted && (
            <div className="mt-2">Try disabling "Only Completed Workouts" filter.</div>
          )}
        </Card>
      )}
    </div>
  );
};

export default WorkoutProgressReport;