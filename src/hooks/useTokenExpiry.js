import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const useTokenExpiry = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem("token");

      if (token) {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          console.log("Token expired. Logging out...");
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          navigate("/login");
        }
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, [navigate]);
};

export default useTokenExpiry;