import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "react-datepicker/dist/react-datepicker.css";

import App from "./App";

import Login from "./components/Login";
import RegisterUser from "./components/RegisterUser";

// import Admin from "./components/Admin";
import Trainer from "./components/Trainer";
import Home from "./components/Home";
import Workout from "./components/Workout";
import Nutrition from "./components/Nutrition";
import Appointments from "./components/Appointments";
// import Payments from "./components/Payments";
// import MyAccount from "./components/MyAccount";

import Unauthorized from "./components/Unauthorized";
import NotFound from "./components/NotFound";

// import ProtectedRoute from "./components/ProtectedRoute";
import AuthRoute from "./components/AuthRoute";

import { AuthProvider } from "./contexts/AuthContext";
import { GlobalToastProvider } from "./contexts/GlobalToastContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "workout", element: <AuthRoute element={<Workout />} /> },
      { path: "nutrition", element: <AuthRoute element={<Nutrition />} /> },
      // { path: "payments", element: <AuthRoute element={<Payments />} /> },
      // { path: "myAccount", element: <AuthRoute element={<MyAccount />} /> },
      // { path: "admin", element: <ProtectedRoute role="admin" element={<Admin />} /> },
      // { path: "Trainer", element: <ProtectedRoute role="trainer" element={<Trainer />} /> },
      { path: "Trainer", element: <AuthRoute element={<Trainer />} /> },
      { path: "appointments", element: <AuthRoute element={<Appointments />} /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register-user", element: <RegisterUser /> },
  { path: "/unauthorized", element: <AuthRoute element={<Unauthorized />} /> },
  { path: "*", element: <NotFound /> }
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <GlobalToastProvider>
        <RouterProvider router={router} />
      </GlobalToastProvider>
    </AuthProvider>
  </React.StrictMode>
);