import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { FiMail, FiStar, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Handle Navigation with Auth Check
  const handleViewProfile = (providerId) => {
    if (!token) {
      navigate('/login');
    } else {
      // Pass the ID so the detail page knows who to fetch
      navigate(`/detail/${providerId}`);
    }
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/getallproviders');
      setProviders(response.data);
    } catch (err) {
      console.error("Error fetching providers", err);
      setError("Failed to load providers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return (
    <div className="py-5" style={{ background: 'var(--bg-main)', minHeight: 'calc(100vh - 76px)' }}>
      <Container>
        <div className="text-center mb-5 animate-up">
          <h2 className="mb-2" style={{ color: 'var(--text-main)', fontWeight: '800' }}>
            Explore Our Providers
          </h2>
          <p className="text-muted">Find the right professional with the perfect experience for your needs.</p>
        </div>

        {error && <Alert variant="danger" className="text-center">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading experts...</p>
          </div>
        ) : (
          <Row className="g-4 animate-up delay-1">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <Col lg={4} md={6} key={provider._id}>
                  <Card className="provider-card h-100 border-0 shadow-sm">
                    <Card.Body className="text-center p-4">
                      <div className="provider-avatar shadow-sm mb-3">
                        {provider.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <Card.Title className="fw-bold mb-1">{provider.name}</Card.Title>
                      
                      <Badge bg="light" text="dark" className="mb-3 d-inline-flex align-items-center gap-1 border">
                        <FiUserCheck className="text-success" /> Verified Provider
                      </Badge>

                      <div className="text-start mt-3 pt-3 border-top">
                        <p className="mb-2 d-flex align-items-center gap-2 text-muted small">
                          <FiMail className="text-primary" /> {provider.email}
                        </p>
                        <p className="mb-0 d-flex align-items-center gap-2 text-muted small">
                          <FiStar className="text-warning" /> 
                          <span>Experience: <strong>{provider.experience} years</strong></span>
                        </p>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-transparent border-0 pb-4 px-4 pt-0">
                      <button 
                        onClick={() => handleViewProfile(provider._id)} 
                        className="btn btn-primary-custom w-100 py-2"
                      >
                        View Profile
                      </button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))
            ) : (
              <div className="text-center py-5">
                <h4>No providers found.</h4>
              </div>
            )}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Providers;