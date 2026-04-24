import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiTwitter, FiGithub, FiLinkedin } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="gy-4">
          <Col lg={4} className="pe-lg-5">
            <Link to="/" className="d-flex align-items-center gap-2 text-white text-decoration-none mb-3">
              <div className="bg-primary rounded d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                <FiBriefcase size={18} />
              </div>
              <span className="fs-4 fw-bold font-heading">ProConnect</span>
            </Link>
            <p className="text-muted pe-lg-4 mb-4">
              The premier destination to discover, vet, and hire the top 1% of creative, technical, and business talent globally.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="btn btn-outline-light rounded-circle p-2 d-flex border-secondary text-muted hover-white"><FiTwitter /></a>
              <a href="#" className="btn btn-outline-light rounded-circle p-2 d-flex border-secondary text-muted hover-white"><FiGithub /></a>
              <a href="#" className="btn btn-outline-light rounded-circle p-2 d-flex border-secondary text-muted hover-white"><FiLinkedin /></a>
            </div>
          </Col>
          <Col lg={2} md={4} xs={6}>
            <h5 className="text-white mb-4 fw-bold">Platform</h5>
            <Link to="/providers" className="footer-link">Browse Providers</Link>
            <Link to="#" className="footer-link">How it Works</Link>
            <Link to="#" className="footer-link">Pricing</Link>
          </Col>
          <Col lg={2} md={4} xs={6}>
            <h5 className="text-white mb-4 fw-bold">Company</h5>
            <Link to="#" className="footer-link">About Us</Link>
            <Link to="#" className="footer-link">Careers</Link>
            <Link to="#" className="footer-link">Contact</Link>
          </Col>
          <Col lg={4} md={4}>
            <h5 className="text-white mb-4 fw-bold">Stay Updated</h5>
            <p className="text-muted">Subscribe to our newsletter for the latest platform updates and tips.</p>
            <div className="d-flex mt-3">
              <input type="email" className="form-control rounded-start-pill bg-dark border-secondary text-white border-end-0" placeholder="Enter your email" />
              <button className="btn btn-primary rounded-end-pill px-4">Subscribe</button>
            </div>
          </Col>
        </Row>
        <hr className="border-secondary my-5" />
        <Row>
          <Col md={6} className="text-muted text-center text-md-start">
            &copy; {new Date().getFullYear()} ProConnect Inc. All rights reserved.
          </Col>
          <Col md={6} className="text-muted text-center text-md-end mt-3 mt-md-0 d-flex gap-4 justify-content-md-end">
            <Link to="#" className="text-muted text-decoration-none hover-white">Terms</Link>
            <Link to="#" className="text-muted text-decoration-none hover-white">Privacy</Link>
            <Link to="#" className="text-muted text-decoration-none hover-white">Cookies</Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
