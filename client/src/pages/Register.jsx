import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    experience: ''
  });

  const baseURL = import.meta.env.VITE_APP_URL;

  const [isProvider, setIsProvider] = useState(false);

  // ✅ ONLY TOAST (remove error/success states)
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
      return setToast({
        show: true,
        message: "Please meet all password requirements",
        type: "danger"
      });
    }

    const endpoint = isProvider
      ? `${baseURL}/api/regprovider`
      : `${baseURL}/api/reguser`;

    try {
      setLoading(true); // ✅ START LOADING

      await axios.post(endpoint, formData);

      setToast({
        show: true,
        message: "Registration successful!",
        type: "success"
      });

      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.Message || "Something went wrong",
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
          <Col md={8} lg={6}>
            <div className="shadow-lg p-4 animate-up" style={{ borderRadius: '1rem', background: '#fff' }}>

              <div className="text-center mb-4">
                <h3 className="fw-bold">Join ProConnect</h3>
              </div>

              <Form onSubmit={handleSubmit}>

                {/* ROLE */}
                <Form.Group className="mb-4 d-flex justify-content-center gap-4">
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

                {/* NAME */}
                <Form.Control
                  className="mb-3"
                  name="name"
                  placeholder="Name"
                  onChange={handleChange}
                  required
                />

                {/* EMAIL */}
                <Form.Control
                  className="mb-3"
                  name="email"
                  type="email"
                  placeholder="Email"
                  onChange={handleChange}
                  required
                />

                {/* PASSWORD */}
                <Form.Control
                  className="mb-3"
                  name="password"
                  type="password"
                  placeholder="Password"
                  onChange={handleChange}
                  required
                />

                {/* PASSWORD RULES */}
                <div className="mb-3">
                  {Object.entries(passwordCriteria).map(([key, val]) => (
                    <small key={key} className={val ? "text-success d-block" : "text-muted d-block"}>
                      {val ? "✓" : "○"} {key}
                    </small>
                  ))}
                </div>

                {/* PROVIDER */}
                {isProvider && (
                  <Form.Control
                    className="mb-3"
                    name="experience"
                    placeholder="Experience"
                    onChange={handleChange}
                    required
                  />
                )}

                <Button type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>

                <div className="text-center mt-3">
                  <Link to="/login">Already have an account?</Link>
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
export default Register;