import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-dark text-light">
            <div
                className="text-center p-5 rounded-4 shadow-lg"
                style={{
                    maxWidth: "500px",
                    width: "90%",
                    background: "linear-gradient(135deg, #1a1a1a, #111)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    boxShadow: "0 0 25px rgba(255, 0, 70, 0.2)",
                }}
            >
                <img
                    src="https://cdn-icons-png.flaticon.com/512/6134/6134065.png"
                    alt="Not Found Illustration"
                    className="img-fluid mb-4"
                    style={{
                        maxWidth: "150px",
                        filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.1))",
                    }}
                />
                <h1
                    className="display-5 fw-semibold mb-3"
                    style={{
                        color: "#ff4c68",
                        textShadow: "0 0 10px rgba(255, 76, 104, 0.5)",
                    }}
                >
                    404 - Page Not Found
                </h1>
                <p className="text-light fs-5 mb-4">
                    Oops! The page you’re looking for doesn’t exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="btn btn-outline-light px-4 py-2 rounded-pill shadow-sm"
                    style={{
                        border: "1px solid #ff4c68",
                        color: "#ff4c68",
                        transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#ff4c68";
                        e.target.style.color = "#fff";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "#ff4c68";
                    }}
                >
                    ⬅️ Back to Home
                </Link>
            </div>
        </div>
    );
}

export default NotFound;