import React, { useEffect, useState } from 'react';
import { Container, Table, Spinner, Alert, Button, Badge, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Allusers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Redirect if not admin
    if (userRole !== 'admin') {
      navigate('/');
    } else {
      fetchUsers();
    }
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    try {
      // 1. Get the base URL from your Vercel Environment Variable
      const baseURL = import.meta.env.VITE_APP_URL;

      // 2. Combine with your getall endpoint
      const { data } = await axios.get(`${baseURL}/api/getall`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, role) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const { data } = await axios.delete(`http://localhost:8000/api/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data.success) {
          setUsers(users.filter(u => u._id !== id));
          setToast({ show: true, message: data.Message || 'Record deleted successfully.', type: 'success' });
        } else {
          setToast({ show: true, message: data.Message || 'Unable to delete record.', type: 'danger' });
        }
      } catch (err) {
        console.error(err);
        const errorMsg = err.response?.data?.Message || 'An error occurred while deleting.';
        setToast({ show: true, message: errorMsg, type: 'danger' });
      }
    }
  };

  const handleEdit = (id) => {
    alert(`Edit feature for ID: ${id} clicked.`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="py-5 animate-up position-relative">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">All Platform Users</h2>
        <Badge bg="primary" className="p-2 fs-6">Total: {users.length}</Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="glass-card shadow-sm border-0 p-4">
        <Table hover responsive className="align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="py-3 border-0">Name</th>
              <th className="py-3 border-0">Email</th>
              <th className="py-3 border-0 mt-1">Role</th>
              <th className="py-3 border-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td className="py-3 fw-semibold">{user.name}</td>
                  <td className="py-3 text-muted">{user.email}</td>
                  <td className="py-3">
                    <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'provider' ? 'success' : 'info'}>
                      {user.role ? user.role.toUpperCase() : 'USER'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2 rounded-circle"
                      onClick={() => handleEdit(user._id)}
                    >
                      <FiEdit />
                    </Button>
                    
                    {user.role !== 'admin' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="rounded-circle"
                        onClick={() => handleDelete(user._id, user.role)}
                      >
                        <FiTrash2 />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-muted">No users found.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

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
    </Container>
  );
};

export default Allusers;
