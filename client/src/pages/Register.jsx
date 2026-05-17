import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiBriefcase, FiUser } from 'react-icons/fi';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    experience: '',
    category: '',
    charges: ''
  });
  const [isProvider, setIsProvider] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'danger'
  });
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  const baseURL = import.meta.env.VITE_APP_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const { password } = formData;

    setPasswordCriteria({
      length: password.length >= 7,
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    });
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    if (!isPasswordValid) {
      return setToast({ show: true, message: 'Please meet all password requirements', type: 'danger' });
    }

    if (isProvider && !formData.category) {
      return setToast({ show: true, message: 'Please select provider category', type: 'danger' });
    }

    if (isProvider && (!formData.charges || Number(formData.charges) <= 0)) {
      return setToast({ show: true, message: 'Please enter valid service charges', type: 'danger' });
    }

    const endpoint = isProvider
      ? `${baseURL}/api/regprovider`
      : `${baseURL}/api/reguser`;

    const payload = isProvider
      ? formData
      : {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

    try {
      setLoading(true);
      const { data } = await axios.post(endpoint, payload);
      if (!data?.success) {
        return setToast({ show: true, message: data?.Message || 'Registration failed', type: 'danger' });
      }
      setToast({ show: true, message: data.Message || 'Registration successful!', type: 'success' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.Message || 'Something went wrong',
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
          <Col md={8} lg={6}>
            <div className="auth-card animate-up">
              <div className="text-center mb-4">
                <div className="auth-mark mx-auto mb-3">P</div>
                <h3 className="fw-bold mb-1">Join ProConnect</h3>
                <p className="text-muted mb-0">Create the right account for how you want to use the platform.</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <div className="role-picker mb-4">
                  <button type="button" className={`role-option ${!isProvider ? 'active' : ''}`} onClick={() => setIsProvider(false)}>
                    <span className="role-icon"><FiUser /></span>
                    <span>
                      <strong>Customer</strong>
                      <small>Find and book services</small>
                    </span>
                  </button>
                  <button type="button" className={`role-option ${isProvider ? 'active' : ''}`} onClick={() => setIsProvider(true)}>
                    <span className="role-icon"><FiBriefcase /></span>
                    <span>
                      <strong>Provider</strong>
                      <small>Offer professional work</small>
                    </span>
                  </button>
                </div>

                <Form.Control className="mb-3" name="name" placeholder="Full name" onChange={handleChange} required />
                <Form.Control className="mb-3" name="email" type="email" placeholder="Email address" onChange={handleChange} required />
                <Form.Control className="mb-3" name="phone" type="tel" placeholder="Phone number for calls" value={formData.phone} onChange={handleChange} />
                <Form.Control className="mb-3" name="password" type="password" placeholder="Password" onChange={handleChange} required />

                <div className="password-rules mb-3">
                  {Object.entries(passwordCriteria).map(([key, val]) => (
                    <small key={key} className={val ? 'text-success' : 'text-muted'}>
                      {val ? '✓' : '○'} {key}
                    </small>
                  ))}
                </div>

                {isProvider && (
                  <>
                    <Form.Select className="mb-3" name="category" value={formData.category} onChange={handleChange} required>
                      <option value="">Select provider category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Plumber">Plumber</option>
                    </Form.Select>

                    <Form.Control className="mb-3" name="experience" placeholder="Experience in years" value={formData.experience} onChange={handleChange} required />
                    <Form.Control className="mb-3" name="charges" type="number" min="1" placeholder="Service charges in Rs." value={formData.charges} onChange={handleChange} required />
                  </>
                )}

                <Button type="submit" className="w-100 btn-primary-custom" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>

                <div className="text-center mt-4">
                  <Link to="/login" className="fw-semibold">Already have an account?</Link>
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

export default Register;
