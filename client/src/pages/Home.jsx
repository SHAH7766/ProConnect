import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiShield, FiStar, FiAlertCircle } from 'react-icons/fi';

const Home = () => {
  const role = localStorage.getItem('role');

  return (
    <section className="hero-section">
      <Container>
        <Row className="align-items-center">
          <Col lg={6} className="mb-5 mb-lg-0">
            <div className="pe-lg-5">
              <div className="badge bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 rounded-pill animate-up">
                Trusted local professional marketplace
              </div>
              <h1 className="hero-title animate-up delay-1">
                Connect with top-tier providers instantly.
              </h1>
              <p className="hero-subtitle animate-up delay-2">
                ProConnect helps customers discover verified plumbers and electricians, compare useful service signals, and send requests with confidence.
              </p>
              <div className="d-flex gap-3 flex-wrap animate-up delay-3">
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
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 text-primary border border-primary border-opacity-25">
                  <FiShield size={32} />
                </div>
                <div>
                  <h4 className="mb-1">Verified Professionals</h4>
                  <p className="text-muted mb-0">Every profile is organized around service history, category, and reliability.</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-4 mb-4">
                <div className="bg-success bg-opacity-10 p-3 rounded-3 text-success border border-success border-opacity-25">
                  <FiCheckCircle size={32} />
                </div>
                <div>
                  <h4 className="mb-1">Simple Requests</h4>
                  <p className="text-muted mb-0">Attach details, upload a picture, and track the provider response.</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-4">
                <div className="bg-warning bg-opacity-10 p-3 rounded-3 text-warning border border-warning border-opacity-25">
                  <FiStar size={32} />
                </div>
                <div>
                  <h4 className="mb-1">Built for Follow-up</h4>
                  <p className="text-muted mb-0">Accepted bookings unlock chat so both sides can negotiate clearly.</p>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {role === 'user' && (
          <Row className="mt-5 pt-4 animate-up delay-3">
            <Col className="text-center">
              <div className="d-inline-block p-4 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(219, 227, 239, 0.9)', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-muted mb-3 small fw-medium text-uppercase">Need assistance with a provider?</p>
                <Link to="/complain" className="text-decoration-none">
                  <Button variant="outline-danger" className="px-4 py-2 d-flex align-items-center gap-2 mx-auto">
                    <FiAlertCircle /> Report a Problem
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </section>
  );
};

export default Home;
