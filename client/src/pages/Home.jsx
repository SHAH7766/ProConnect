import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiShield, FiStar } from 'react-icons/fi';

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="pe-lg-5">
                <div className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill animate-up">
                  🌟 The #1 Platform for Professionals
                </div>
                <h1 className="hero-title animate-up delay-1">
                  Connect with Top-Tier Providers Instantly.
                </h1>
                <p className="hero-subtitle animate-up delay-2">
                  ProConnect bridges the gap between you and highly qualified professionals. Secure, fast, and reliable service delivery at your fingertips.
                </p>
                <div className="d-flex gap-3 animate-up delay-3">
                  <Link to="/providers" className="btn btn-primary-custom d-flex align-items-center gap-2">
                    Find a Provider <FiArrowRight />
                  </Link>
                  <Link to="/register" className="btn btn-outline-custom">
                    Become a Provider
                  </Link>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="glass-card animate-up delay-2">
                <div className="d-flex align-items-center gap-4 mb-4">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary border border-primary border-opacity-25">
                    <FiShield size={32} />
                  </div>
                  <div>
                    <h4 className="mb-1">Verified Professionals</h4>
                    <p className="text-muted mb-0">Every provider undergoes strict vetting.</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-4 mb-4">
                  <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success border border-success border-opacity-25">
                    <FiCheckCircle size={32} />
                  </div>
                  <div>
                    <h4 className="mb-1">Instant Connection</h4>
                    <p className="text-muted mb-0">Book services effortlessly and quickly.</p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-4">
                  <div className="bg-warning bg-opacity-10 p-3 rounded-circle text-warning border border-warning border-opacity-25">
                    <FiStar size={32} />
                  </div>
                  <div>
                    <h4 className="mb-1">Premium Quality</h4>
                    <p className="text-muted mb-0">Top-rated services guaranteed.</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;
