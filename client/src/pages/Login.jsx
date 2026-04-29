import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  // 1. Get your base URL from the Vercel environment variable
  const baseURL = import.meta.env.VITE_APP_URL;

  // 2. Build the endpoint dynamically using the baseURL
  const endpoint = isProvider
    ? `http://localhost:8000/api/loginprovider`
    : `http://localhost:8000/api/loginuser`;

  try {
    const { data } = await axios.post(endpoint, { email, password });
    
    if (data && data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      
      if (data.role === "provider")
        navigate('/providers');
      else
        navigate('/allusers');

    } else if (data) {
      setError(data.Message || 'Login failed. Please check credentials.');
    }
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.Message || err.response?.data?.message || 'Login failed. Please check credentials.');
  }
};

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 76px)', background: 'var(--bg-main)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <div className="glass-card shadow-lg border-0 animate-up">
              <div className="text-center mb-4">
                <h3 className="fw-bold">Welcome Back!</h3>
                <p className="text-muted">Login to continue to ProConnect</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3 d-flex justify-content-center gap-4">
                  <Form.Check
                    type="radio" label="I am a User" name="role"
                    checked={!isProvider} onChange={() => setIsProvider(false)}
                  />
                  <Form.Check
                    type="radio" label="I am a Provider" name="role"
                    checked={isProvider} onChange={() => setIsProvider(true)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Email address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="btn-primary-custom w-100 py-3 mb-3">
                  Sign In
                </Button>

                <div className="text-center mt-3">
                  <span className="text-muted">Don't have an account? </span>
                  <Link to="/register" className="text-primary fw-semibold text-decoration-none">Register here</Link>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
