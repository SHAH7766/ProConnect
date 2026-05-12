import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Toast, ToastContainer } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiUser } from 'react-icons/fi';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'danger'
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email && !password) {
      return setToast({ show: true, message: 'Please enter email and password', type: 'danger' });
    }

    if (!email) {
      return setToast({ show: true, message: 'Email is required', type: 'danger' });
    }

    if (!password) {
      return setToast({ show: true, message: 'Password is required', type: 'danger' });
    }

    const baseURL = import.meta.env.VITE_APP_URL;
    const endpoint = isProvider
      ? `${baseURL}/api/loginprovider`
      : `${baseURL}/api/loginuser`;

    try {
      setLoading(true);
      const { data } = await axios.post(endpoint, { email, password });

      if (data && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        setToast({ show: true, message: 'Login successful!', type: 'success' });

        setTimeout(() => {
          if (data.role === 'provider') navigate('/profile');
          else if (data.role === 'admin') navigate('/allusers');
          else navigate('/providers');
        }, 1000);
      } else {
        setToast({ show: true, message: data.Message || 'Invalid credentials', type: 'danger' });
      }
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.Message || 'Invalid credentials',
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen d-flex align-items-center justify-content-center">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <div className="auth-card animate-up">
              <div className="text-center mb-4">
                <div className="auth-mark mx-auto mb-3">P</div>
                <h3 className="fw-bold mb-1">Welcome Back</h3>
                <p className="text-muted mb-0">Choose your role and continue to ProConnect.</p>
              </div>

              <Form onSubmit={handleSubmit} noValidate>
                <div className="role-picker mb-4">
                  <button type="button" className={`role-option ${!isProvider ? 'active' : ''}`} onClick={() => setIsProvider(false)}>
                    <span className="role-icon"><FiUser /></span>
                    <span>
                      <strong>Customer</strong>
                      <small>Book trusted services</small>
                    </span>
                  </button>
                  <button type="button" className={`role-option ${isProvider ? 'active' : ''}`} onClick={() => setIsProvider(true)}>
                    <span className="role-icon"><FiBriefcase /></span>
                    <span>
                      <strong>Provider</strong>
                      <small>Manage requests</small>
                    </span>
                  </button>
                </div>

                <Form.Control className="mb-3" type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Form.Control className="mb-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

                <Link to="/forgotpassword" className="mb-3 d-block text-end fw-semibold">Forgot password?</Link>

                <Button type="submit" className="w-100 py-2 btn-primary-custom" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Logging in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="text-center mt-4">
                  <span>Don't have an account? </span>
                  <Link to="/register" className="fw-semibold">Register</Link>
                </div>
              </Form>
            </div>
          </Col>
        </Row>

        <ToastContainer position="bottom-end" className="p-3">
          <Toast bg={toast.type} show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
            <Toast.Body className="text-white">{toast.message}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </div>
  );
};

export default Login;
