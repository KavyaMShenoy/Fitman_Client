import React, { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const NutritionChart = ({ totalMacros, dailyCalorieGoal, waterIntake, dailyWaterGoal }) => {

    const chartData = useMemo(() => ({
        labels: ["Calories Consumed", "Remaining", "Water Consumed", "Water Remaining"],
        datasets: [
            {
                label: "Calories",
                data: [
                    totalMacros.calories,
                    Math.max(dailyCalorieGoal - totalMacros.calories, 0),
                    waterIntake,
                    Math.max(dailyWaterGoal - waterIntake, 0)
                ],
                backgroundColor: ["#28a745", "#ffc107", "#007bff", "#17a2b8"],
                hoverBackgroundColor: ["#218838", "#e0a800","#0056b3", "#138496"],
            }
        ]
    }), [totalMacros, dailyCalorieGoal, waterIntake, dailyWaterGoal]);
    return (
        <div>
            <Doughnut data={chartData} style={{ height: "360px", maxHeight: "360px" }}/>
        </div>
    );
};

export default NutritionChart;