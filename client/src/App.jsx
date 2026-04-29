import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Providers from './pages/Providers';
import Allusers from './pages/Allusers';
import Profile from './pages/Profile';
import Detail from './pages/Detail';
import Complain from './pages/Complain';
function App() {
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
          <Route path='/detail' element={<Detail />} />
          <Route path='/complain' element={<Complain />} /> {/* New route for Complain page */}
        </Routes>
      </div>
    </>
  );
}

export default App;
