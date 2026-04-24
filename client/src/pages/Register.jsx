import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', experience: '' });
  const [isProvider, setIsProvider] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Get the base URL from your Vercel Environment Variable
    const baseURL = import.meta.env.VITE_APP_URL;

    // 2. Build the endpoint dynamically
    const endpoint = isProvider 
      ? `${baseURL}/api/regprovider` 
      : `${baseURL}/api/reguser`;
    
    try {
      const { data } = await axios.post(endpoint, formData);
      if(data) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
};
  return (
    <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: 'calc(100vh - 76px)', background: 'var(--bg-main)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="glass-card shadow-lg border-0 animate-up">
              <div className="text-center mb-4">
                <h3 className="fw-bold">Join ProConnect</h3>
                <p className="text-muted">Create your account to get started</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4 d-flex justify-content-center gap-4 p-3 rounded" style={{ background: 'rgba(79, 70, 229, 0.05)' }}>
                  <Form.Check 
                    type="radio" label="Register as User" name="role" 
                    checked={!isProvider} onChange={() => setIsProvider(false)} 
                    className="fw-semibold"
                  />
                  <Form.Check 
                    type="radio" label="Register as Provider" name="role" 
                    checked={isProvider} onChange={() => setIsProvider(true)} 
                    className="fw-semibold"
                  />
                </Form.Group>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Full Name</Form.Label>
                      <Form.Control 
                        type="text" name="name" 
                        value={formData.name} onChange={handleChange} 
                        placeholder="John Doe" required 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Email address</Form.Label>
                      <Form.Control 
                        type="email" name="email" 
                        value={formData.email} onChange={handleChange} 
                        placeholder="name@example.com" required 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <Form.Control 
                    type="password" name="password" 
                    value={formData.password} onChange={handleChange} 
                    placeholder="Create a strong password" required 
                  />
                </Form.Group>

                {isProvider && (
                  <Form.Group className="mb-4 animate-up">
                    <Form.Label className="fw-semibold">Experience (Years/Details)</Form.Label>
                    <Form.Control 
                      type="text" name="experience" 
                      value={formData.experience} onChange={handleChange} 
                      placeholder="e.g. 5 Years in Plumbing" required={isProvider} 
                    />
                  </Form.Group>
                )}

                <Button variant="primary" type="submit" className="btn-primary-custom w-100 py-3 mt-2 mb-3">
                  Create Account
                </Button>

                <div className="text-center mt-3">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/login" className="text-primary fw-semibold text-decoration-none">Sign In instead</Link>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
