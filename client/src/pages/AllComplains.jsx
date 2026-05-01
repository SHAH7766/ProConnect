import React, { useEffect, useState } from 'react';
import { Container, Table, Badge, Button, Toast, ToastContainer, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { FiTrash2 } from 'react-icons/fi';

const AllComplains = () => {
  const token = localStorage.getItem('token');
  const [loading, setloading] = useState(true)

  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');
  const baseURL = import.meta.env.VITE_APP_URL;
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ✅ GET ALL COMPLAINTS
  const fetchComplaints = async () => {
    try {
      const result = await axios.get(
        `${baseURL}/api/allcomplaints`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setComplaints(result.data); // ✅ FIXED
      setloading(false)

    } catch (error) {
      console.log(error);
      setError('Failed to fetch complaints');
    }
  };
  if (loading) {
    return (
      <div className='d-flex justify-content-center mt-5'>
        <div className="spinner-border text-primary " role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>)
  }
  // ✅ UPDATE STATUS
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `${baseURL}/api/updatecomplaintstatus/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setToast({
        show: true,
        message: 'Status updated successfully',
        type: 'success'
      });

      fetchComplaints();

    } catch (error) {
      console.log(error);

      setToast({
        show: true,
        message: 'Failed to update status',
        type: 'danger'
      });
    }
  };

  // (optional delete)
  const handleDelete = (id) => {
    console.log("Delete complaint:", id);
  };

  return (
    <Container className="py-5 position-relative">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">All Complaints</h2>
        <Badge bg="primary" className="p-2 fs-6">
          Total: {complaints.length}
        </Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="glass-card shadow-sm border-0 p-4">

        <Table hover responsive className="align-middle mb-0">

          <thead className="bg-light">
            <tr>
              <th>ID</th>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Customer Email</th>
              <th>Message</th>
              <th>Status</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
                <tr key={complaint._id}>

                  <td className="fw-semibold">{complaint._id.slice(0, 10)}</td>

                  <td>
                    {complaint.customerId._id}
                  </td>

                  <td>{complaint.customerId.name}</td>
                  <td>{complaint.customerId.email}</td>
                  <td>{complaint.message}</td>

                  {/* ✅ STATUS DROPDOWN */}
                  <td>
                    <select
                      value={complaint.status}
                      onChange={(e) =>
                        handleStatusChange(complaint._id, e.target.value)
                      }
                      className="form-select form-select-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>


                  <td>{complaint.TypeOfComplaint}</td>

                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="rounded-circle"
                      onClick={() => handleDelete(complaint._id)}
                    >
                      <FiTrash2 />
                    </Button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No complaints found
                </td>
              </tr>
            )}
          </tbody>

        </Table>
      </div>

      {/* ✅ TOAST */}
      <ToastContainer position="bottom-end" className="p-3">

        <Toast
          bg={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
          show={toast.show}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">
            {toast.message}
          </Toast.Body>
        </Toast>

      </ToastContainer>

    </Container>
  );
};

export default AllComplains;