import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiBriefcase, FiUsers } from 'react-icons/fi';

const Navigation = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

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
            {userRole !== 'admin' && (
              <>
                
                {/* <Nav.Link as={Link} to="/providers">Find Providers</Nav.Link> */}
              </>
            )}
            {isLoggedIn && userRole === 'admin' && (
              <Nav.Link as={Link} to="/allusers" className="d-flex align-items-center gap-1">
                <FiUsers /> All Users
              </Nav.Link>
            )}
          </Nav>
          <Nav className="gap-3 mt-3 mt-lg-0">
            {isLoggedIn ? (
              <>
                <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
                <Nav.Link as={Link} to="/allcomplaints"> Complaints</Nav.Link>
                <Button onClick={handleLogout} className="btn-outline-custom">Logout</Button>
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
