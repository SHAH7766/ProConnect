import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import { FiCpu, FiDollarSign, FiSearch, FiStar, FiTrendingUp, FiUserCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationSource, setRecommendationSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryReason, setCategoryReason] = useState('');
  const [categorySource, setCategorySource] = useState('');
  const [userNeed, setUserNeed] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_APP_URL;

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleViewProfile = (providerId) => {
    const profilePath = `/detail/${providerId}`;
    if (!token) {
      navigate('/login', { state: { from: profilePath } });
    } else {
      navigate(profilePath);
    }
  };

  const getRecommendationForProvider = (providerId) => {
    return recommendations.find((item) => item.providerId === providerId);
  };

  const fetchProvidersByCategory = async (category) => {
    const params = new URLSearchParams({ category });
    const response = await axios.get(`${baseURL}/api/providers/search?${params.toString()}`);
    return response.data;
  };

  const getAiRecommendations = async (providerList, category) => {
    const { data } = await axios.post(`${baseURL}/api/recommendproviders`, {
      providers: providerList,
      category,
      userNeed
    });

    setRecommendations(data.recommendations || []);
    setRecommendationSource(data.source || '');
  };

  useEffect(() => {
    const trimmedNeed = userNeed.trim();

    if (trimmedNeed.length < 8) {
      setProviders([]);
      setRecommendations([]);
      setSelectedCategory('');
      setCategoryReason('');
      setCategorySource('');
      setRecommendationSource('');
      setHasSearched(false);
      setError(null);
      return;
    }

    const timeout = setTimeout(() => {
      searchProvidersWithAi(trimmedNeed);
    }, 900);

    return () => clearTimeout(timeout);
  }, [userNeed]);

  const searchProvidersWithAi = async (problemText) => {
    if (!problemText.trim()) {
      return;
    }

    try {
      setLoading(true);
      setAiLoading(true);
      setError(null);
      setHasSearched(true);
      setProviders([]);
      setRecommendations([]);
      setRecommendationSource('');
      setCategoryReason('');
      setCategorySource('');

      const { data: categoryData } = await axios.post(`${baseURL}/api/detectcategory`, {
        problem: problemText
      });

      const detectedCategory = categoryData.category;
      setSelectedCategory(detectedCategory);
      setCategoryReason(categoryData.reason || '');
      setCategorySource(categoryData.source || '');

      const providerList = await fetchProvidersByCategory(detectedCategory);
      setProviders(providerList);

      if (providerList.length > 0) {
        await getAiRecommendations(providerList, detectedCategory);
      }
    } catch (err) {
      console.error('AI provider search error', err);
      setError(err.response?.data?.Message || 'Unable to analyze your problem.');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  return (
    <div className="py-5" style={{ background: 'var(--bg-main)', minHeight: 'calc(100vh - 76px)' }}>
      <Container>
        <div className="text-center mb-4 animate-up">
          <h2 className="mb-2" style={{ color: 'var(--text-main)', fontWeight: '800' }}>
            Tell Us The Problem
          </h2>
          <p className="text-muted">Describe what is wrong. AI will choose the right category and recommend providers.</p>
        </div>

        <div className="glass-card mb-4">
          <Form>
            <Row className="g-3 align-items-end">
              <Col xs={12}>
                <Form.Label>Describe your issue</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="userNeed"
                  placeholder="e.g. my kitchen pipe is leaking, or my switch board is sparking"
                  value={userNeed}
                  onChange={(e) => setUserNeed(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Recommendations appear automatically as you type.
                </Form.Text>
              </Col>

              {selectedCategory && categoryReason && (
                <Col xs={12}>
                  <Alert variant="info" className="mb-0">
                    <strong>AI selected: {selectedCategory}</strong>
                    <div className="small mt-1">{categoryReason}</div>
                    <Badge bg={categorySource === 'gemini' ? 'primary' : 'secondary'} className="mt-2">
                      {categorySource === 'groq' ? 'Groq AI' : categorySource === 'gemini' ? 'Gemini AI' : 'Smart fallback'}
                    </Badge>
                  </Alert>
                </Col>
              )}

              {(aiLoading || loading) && (
                <Col xs={12} className="text-center text-muted fw-semibold">
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  AI is finding the right providers...
                </Col>
              )}
            </Row>
          </Form>
        </div>

        {error && <Alert variant="danger" className="text-center">{error}</Alert>}

        {recommendations.length > 0 && (
          <div className="glass-card mb-4">
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
              <div>
                <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                  <FiCpu className="text-primary" />
                  AI Recommendations
                </h4>
                <p className="text-muted mb-0">
                  AI detected the category and ranked providers using rating, completion rate, charges, and your need.
                </p>
              </div>
              <Badge bg={recommendationSource === 'gemini' ? 'primary' : 'secondary'}>
                {recommendationSource === 'groq' ? 'Groq AI' : recommendationSource === 'gemini' ? 'Gemini AI' : 'Smart fallback'}
              </Badge>
            </div>
            <Row className="g-3">
              {recommendations.map((item, index) => (
                <Col md={4} key={item.providerId || item.name}>
                  <div className="border rounded-3 p-3 h-100 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>#{index + 1} {item.name}</strong>
                      <Badge bg="success">{item.score}</Badge>
                    </div>
                    <p className="text-muted small mb-0">{item.reason}</p>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">AI is matching your request...</p>
          </div>
        ) : (
          <Row className="g-4 animate-up delay-1">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <Col lg={4} md={6} key={provider._id}>
                  <Card className="provider-card h-100 border-0 shadow-sm">
                    <Card.Body className="text-center p-4">
                      {getRecommendationForProvider(provider._id) && (
                        <Badge bg="primary" className="mb-3">
                          <FiCpu className="me-1" />
                          AI Pick
                        </Badge>
                      )}
                      <div className="provider-avatar shadow-sm mb-3">
                        {provider.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <Card.Title className="fw-bold mb-1">{provider.name}</Card.Title>

                      <Badge bg="light" text="dark" className="mb-3 d-inline-flex align-items-center gap-1 border">
                        <FiUserCheck className="text-success" /> Verified {provider.category}
                      </Badge>

                      <div className="text-start mt-3 pt-3 border-top">
                        <p className="mb-2 d-flex align-items-center gap-2 text-muted small">
                          <FiStar className="text-warning" />
                          <span>Rating: <strong>{provider.rating}</strong></span>
                        </p>
                        <p className="mb-2 d-flex align-items-center gap-2 text-muted small">
                          <FiDollarSign className="text-success" />
                          <span>
                            Charges: <strong>Rs. {provider.charges}</strong>
                            {provider.travelFee > 0 && <small className="text-muted"> incl. Rs. {provider.travelFee} travel</small>}
                          </span>
                        </p>
                        <p className="mb-0 d-flex align-items-center gap-2 text-muted small">
                          <FiTrendingUp className="text-primary" />
                          <span>Completion: <strong>{provider.completionRate}%</strong></span>
                        </p>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-transparent border-0 pb-4 px-4 pt-0">
                      <button onClick={() => handleViewProfile(provider._id)} className="btn btn-primary-custom w-100 py-2">
                        View Profile
                      </button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))
            ) : hasSearched ? (
              <div className="text-center py-5 text-muted">
                <FiSearch size={34} className="mb-3" />
                <h4 className="fw-bold">No active {selectedCategory || 'matching'} providers available.</h4>
                <p className="mb-0">
                  AI detected that your issue needs a {selectedCategory || 'matching provider'}, but no admin-approved providers are active in this category right now.
                </p>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <FiSearch size={34} className="mb-3" />
                <h4 className="fw-bold">Describe your problem to begin.</h4>
                <p>AI will decide whether you need a plumber or electrician.</p>
              </div>
            )}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Providers;
