import React, { useState, useEffect } from 'react';
import { Navigate, Routes, Route, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Providers from './pages/Providers';
import Allusers from './pages/Allusers';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import MyBookings from './pages/MyBookings';
import Detail from './pages/Detail';
import Complain from './pages/Complain';
import AllComplains from './pages/AllComplains';
import { getTokenExpiration } from './Auth/LogoutHandler.js';
import ForgotPasswordForm from './pages/ForgotPasswordForm.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

const RoleRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const expiryTime = getTokenExpiration(token);
    const currentTime = Date.now();
    if (expiryTime <= currentTime) {
      logout();
      return;
    }
    const timeout = setTimeout(() => {
      logout();
    }, expiryTime - currentTime);

    return () => clearTimeout(timeout);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };
  return (
    <>
      <Navigation />
      <div style={{ paddingTop: '76px' }}> {/* Offset for fixed navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/allusers" element={<Allusers />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/edit-profile' element={<EditProfile />} />
          <Route path='/my-bookings' element={<MyBookings />} />
          <Route path='/detail/:id' element={<Detail />} />
          <Route path='/complain' element={
            <RoleRoute allowedRoles={['user', 'admin']}>
              <Complain />
            </RoleRoute>
          } />
          <Route path='/allcomplaints' element={
            <RoleRoute allowedRoles={['admin']}>
              <AllComplains />
            </RoleRoute>
          } />
          <Route path='/forgotpassword' element={<ForgotPasswordForm />} />
          <Route path='/resetpassword/:token' element={<ResetPassword />} />
          
        </Routes>
      </div>
    </>
  );
}

export default App;
