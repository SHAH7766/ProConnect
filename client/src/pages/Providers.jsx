import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { FiBriefcase, FiDollarSign, FiMapPin, FiSearch, FiStar, FiTrendingUp, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Plumber');
  const [filters, setFilters] = useState({
    maxCharges: '',
    maxDistance: '',
    minCompletionRate: ''
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_APP_URL;

  const handleViewProfile = (providerId) => {
    if (!token) {
      navigate('/login');
    } else {
      navigate(`/detail/${providerId}`);
    }
  };

  const fetchProviders = async (category = selectedCategory) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ category });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`${baseURL}/api/providers/search?${params.toString()}`);
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

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    fetchProviders(category);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProviders();
  };

  return (
    <div className="py-5" style={{ background: 'var(--bg-main)', minHeight: 'calc(100vh - 76px)' }}>
      <Container>
        <div className="text-center mb-4 animate-up">
          <h2 className="mb-2" style={{ color: 'var(--text-main)', fontWeight: '800' }}>
            Find Service Providers
          </h2>
          <p className="text-muted">Choose a category, tune the filters, and request the right expert.</p>
        </div>

        <div className="glass-card mb-4">
          <div className="d-flex justify-content-center gap-2 flex-wrap mb-4">
            {['Plumber', 'Electrician'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                onClick={() => handleCategorySelect(category)}
                className="px-4"
              >
                <FiBriefcase className="me-2" />
                {category}
              </Button>
            ))}
          </div>

          <Form onSubmit={handleSearch}>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label>Max Charges</Form.Label>
                <Form.Control name="maxCharges" type="number" placeholder="e.g. 2500" value={filters.maxCharges} onChange={handleFilterChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Max Distance</Form.Label>
                <Form.Control name="maxDistance" type="number" placeholder="e.g. 8 km" value={filters.maxDistance} onChange={handleFilterChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Min Completion Rate</Form.Label>
                <Form.Control name="minCompletionRate" type="number" placeholder="e.g. 90" value={filters.minCompletionRate} onChange={handleFilterChange} />
              </Col>
              <Col xs={12}>
                <Button type="submit" className="w-100 btn-primary-custom">
                  <FiSearch className="me-2" />
                  Find Providers
                </Button>
              </Col>
            </Row>
          </Form>
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
                          <FiStar className="text-warning" />
                          <span>Rating: <strong>{provider.rating}</strong></span>
                        </p>
                        <p className="mb-2 d-flex align-items-center gap-2 text-muted small">
                          <FiDollarSign className="text-success" />
                          <span>Charges: <strong>Rs. {provider.charges}</strong></span>
                        </p>
                        <p className="mb-2 d-flex align-items-center gap-2 text-muted small">
                          <FiMapPin className="text-danger" />
                          <span>Distance: <strong>{provider.distance} km</strong></span>
                        </p>
                        <p className="mb-0 d-flex align-items-center gap-2 text-muted small">
                          <FiTrendingUp className="text-primary" />
                          <span>Completion: <strong>{provider.completionRate}%</strong></span>
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
