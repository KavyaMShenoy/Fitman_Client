import React, { createContext, useContext, useState, useEffect } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const GlobalToastProvider = ({ children }) => {
  const [toastState, setToastState] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  const showToast = (message, variant = "success") => {
    setToastState({ show: true, message, variant });
  };

  useEffect(() => {
    if (toastState.show) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [toastState.show]);

  return (
    <ToastContext.Provider value={{ showToastNotification: showToast }}>
      {children}

      {toastState.show && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            }}
          />
          
          <ToastContainer
            className="p-3"
            style={{
              zIndex: 1001,
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <Toast
              show={toastState.show}
              bg={toastState.variant}
              onClose={() => setToastState({ ...toastState, show: false })}
              delay={3000}
              autohide
            >
              <Toast.Header>
                <strong className="me-auto">Notification</strong>
                <small>Just now</small>
              </Toast.Header>
              <Toast.Body>{toastState.message}</Toast.Body>
            </Toast>
          </ToastContainer>
        </>
      )}
    </ToastContext.Provider>
  );
};
