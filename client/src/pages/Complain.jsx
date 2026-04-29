
import axios from 'axios';
import React, { useState } from 'react'
import { Container, Table, Spinner, Alert, Button, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Complain = () => {
  let navigate = useNavigate()
  const [message, setMessage] = useState('');
  const [TypeOfComplaint, setTypeOfComplaint] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleSubmit = async (e) => {
    let tokena = localStorage.getItem('token') 
    e.preventDefault();
    try {
      let result = await axios.post('http://localhost:8000/api/customerservice', { message, TypeOfComplaint }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ show: true, message: result.data.Message, type: 'success' });
      setTimeout(() => {
        navigate('/')
      }, 1500);
      // Handle success (e.g., show a success message or redirect)
    } catch (error) {
      console.log(error);
      setToast({ show: true, message: 'An error occurred while submitting the complaint.', type: 'danger' });
      // Handle error (e.g., show an error message)
    }
  };
  return (
    <>
      <div className="container my-5">
        <h2 className="mb-4">Report a Problem</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="complaintType" className="form-label">Type of Complaint</label>
            <select className="form-select" id="complaintType" value={TypeOfComplaint} onChange={(e) => setTypeOfComplaint(e.target.value)} required>
              <option value="">Select a type</option>
              <option value="service quality">Service Quality</option>
              <option value="payment issue">Payment Issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="complaintMessage" className="form-label">Complaint Details</label>
            <textarea onChange={(e) => setMessage(e.target.value)} value={message} className="form-control" id="complaintMessage" rows="5" placeholder="Describe your issue in detail..." required></textarea>
          </div>
          <button type="submit" className="btn btn-danger">Submit Complaint</button>
        </form>
        <ToastContainer position="bottom-end" className="p-3" style={{ position: 'fixed', zIndex: 1050 }}>
          <Toast
            bg={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
            show={toast.show}
            delay={4000}
            autohide
          >
            <Toast.Header closeButton className={`text-${toast.type} fw-bold`}>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body className={toast.type === 'light' ? 'text-dark' : 'text-white fw-semibold'}>
              {toast.message}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </>
  )
}

export default Complain
