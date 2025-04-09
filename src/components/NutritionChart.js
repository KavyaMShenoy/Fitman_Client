import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const NutritionChart = ({ totalMacros, dailyCalorieGoal, waterIntake, dailyWaterGoal }) => {
  const chartData = useMemo(() => ({
    labels: ["Calories Consumed", "Remaining", "Water Consumed", "Water Remaining"],
    datasets: [
      {
        label: "Nutrition Overview",
        data: [
          totalMacros.calories,
          Math.max(dailyCalorieGoal - totalMacros.calories, 0),
          waterIntake,
          Math.max(dailyWaterGoal - waterIntake, 0)
        ],
        backgroundColor: ["#28a745", "#ffc107", "#007bff", "#17a2b8"],
        hoverBackgroundColor: ["#218838", "#e0a800", "#0056b3", "#138496"],
      }
    ]
  }), [totalMacros, dailyCalorieGoal, waterIntake, dailyWaterGoal]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      }
    }
  };

  return (
    <div style={{ height: "380px", maxWidth: "400px", margin: "0 auto" }} className="mt-3">
      <Doughnut data={chartData} options={chartOptions} />
    </div>
  );
};

export default NutritionChart;