import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
    const [loading, setLoading] = useState(false);

  // ✅ TOAST STATE
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'danger'
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email && !password) {
    return setToast({ show: true, message: "Please enter email and password", type: "danger" });
  }

  if (!email) {
    return setToast({ show: true, message: "Email is required", type: "danger" });
  }

  if (!password) {
    return setToast({ show: true, message: "Password is required", type: "danger" });
  }

  const baseURL = import.meta.env.VITE_APP_URL;
  const endpoint = isProvider
    ? `${baseURL}/api/loginprovider`
    : `${baseURL}/api/loginuser`;

  try {
    setLoading(true); // ✅ START LOADING

    const { data } = await axios.post(endpoint, { email, password });

    if (data && data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      setToast({
        show: true,
        message: "Login successful!",
        type: "success"
      });

      setTimeout(() => {
        if (data.role === "provider") navigate('/providers');
        else navigate('/allusers');
      }, 1500);

    } else {
      setToast({
        show: true,
        message: data.Message || "Invalid credentials",
        type: "danger"
      });
    }

  } catch (err) {
    setToast({
      show: true,
      message: err.response?.data?.Message || "Invalid credentials",
      type: "danger"
    });
  } finally {
    setLoading(false); // ✅ STOP LOADING
  }
};

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: 'calc(100vh - 76px)' }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <div className="shadow-lg p-4 animate-up" style={{ borderRadius: '1rem', background: '#fff' }}>

              <div className="text-center mb-4">
                <h3 className="fw-bold">Welcome Back!</h3>
                <p className="text-muted">Login to continue</p>
              </div>

              {/* ✅ IMPORTANT */}
              <Form onSubmit={handleSubmit} noValidate>

                {/* ROLE */}
                <Form.Group className="mb-3 d-flex justify-content-center gap-4">
                  <Form.Check
                    type="radio"
                    label="User"
                    checked={!isProvider}
                    onChange={() => setIsProvider(false)}
                  />
                  <Form.Check
                    type="radio"
                    label="Provider"
                    checked={isProvider}
                    onChange={() => setIsProvider(true)}
                  />
                </Form.Group>

                {/* EMAIL */}
                <Form.Control
                  className="mb-3"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* PASSWORD */}
                <Form.Control
                  className="mb-4"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Link to="/forgotpassword" className="mb-3 d-block text-end">Forgot password?</Link>

                <Button type="submit" className="w-100 py-2" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Logging in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center mt-3">
                  <span>Don't have an account? </span>
                  <Link to="/register">Register</Link>
                </div>

              </Form>
            </div>
          </Col>
        </Row>

        {/* ✅ TOAST */}
        <ToastContainer position="bottom-end" className="p-3">
          <Toast
            bg={toast.type}
            show={toast.show}
            onClose={() => setToast({ ...toast, show: false })}
            delay={3000}
            autohide
          >
            <Toast.Body className="text-white">
              {toast.message}
            </Toast.Body>
          </Toast>
        </ToastContainer>

      </Container>
    </div>
  );
};

export default Login;