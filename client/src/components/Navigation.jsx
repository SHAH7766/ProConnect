import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiBriefcase, FiCalendar, FiEdit, FiLogOut, FiUser } from 'react-icons/fi';
const Navigation = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const canViewComplaints = userRole === 'user';
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };
  return (
    <Navbar expand="lg" className="navbar-custom fixed-top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <FiBriefcase className="text-primary" />
          ProConnect
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
          </Nav>
          <Nav className="gap-3 mt-3 mt-lg-0">
            {isLoggedIn ? (
              <>
                <NavDropdown title="Account" align="end" className="account-dropdown">
                  <NavDropdown.Item as={Link} to="/profile">
                    <FiUser className="me-2" />
                    {userRole === 'provider' ? 'Dashboard' : 'Profile'}
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/edit-profile">
                    <FiEdit className="me-2" />
                    Edit Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/my-bookings">
                    <FiCalendar className="me-2" />
                    My Bookings
                  </NavDropdown.Item>
                  {canViewComplaints && (
                    <NavDropdown.Item as={Link} to="/complain">
                      <FiAlertTriangle className="me-2" />
                      Complaints
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    <FiLogOut className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-custom">Log In</Link>
                <Link to="/register" className="btn btn-primary-custom">Sign Up Free</Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
export default Navigation;
