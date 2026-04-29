import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiShield, FiStar, FiAlertCircle } from 'react-icons/fi';


const Home = () => {
  const role = localStorage.getItem('role')
  console.log(role)
  const [showComplain, setShowComplain] = useState(false);

  return (
    <>
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            {/* Left Content */}
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

            {/* Right Content (Glass Card) */}
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

          {/* Centered Complaint Button Section */}
          {role === 'user' ? <>
          <Row className="mt-5 pt-5 animate-up delay-3">
            <Col className="text-center">
              <div className="d-inline-block p-4 rounded-4" style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <p className="text-muted mb-3 small fw-medium text-uppercase tracking-wider">Need assistance with a provider?</p>
                <Link to='/complain' className='text-decoration-none'>
                  <Button
                    variant="outline-danger"
                    className="rounded-pill px-4 py-2 d-flex align-items-center gap-2 mx-auto"

                  >
                    <FiAlertCircle /> Report a Problem
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
          </> : <></>}
        </Container>
      </section>
    </>
  );
};

export default Home;