import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Badge, Button, Col, Container, Form, Modal, Row, Spinner, Table, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiCheckCircle, FiCreditCard, FiEdit, FiImage, FiLogOut, FiMessageCircle, FiSend, FiTrash2, FiUser, FiXCircle } from 'react-icons/fi';

const Profile = () => {
    const [data, setData] = useState(null);
    const [activity, setActivity] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_APP_URL;

    useEffect(() => {
        fetchProfile();
        fetchBookings();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(data.profile);
            setActivity(data.activity);
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/api/mybookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(data);
        } catch (err) {
            console.error("Bookings fetch error:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate('/login');
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;
        if (!passwordRegex.test(passwordForm.newPassword)) {
            setToast({
                show: true,
                message: "New password needs 7+ chars, uppercase, number, and special character.",
                type: 'danger'
            });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setToast({ show: true, message: "New password and confirm password do not match.", type: 'danger' });
            return;
        }

        try {
            setSavingPassword(true);
            const { data } = await axios.put(`${baseURL}/api/profile/password`, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setToast({ show: true, message: data.Message, type: 'success' });
            setShowPasswordModal(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setToast({
                show: true,
                message: err.response?.data?.Message || "Unable to update password.",
                type: 'danger'
            });
        } finally {
            setSavingPassword(false);
        }
    };

    const updateBookingStatus = async (bookingId, status) => {
        try {
            const { data } = await axios.put(`${baseURL}/api/bookings/${bookingId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: data.Message, type: 'success' });
            fetchBookings();
            fetchProfile();
        } catch (err) {
            setToast({
                show: true,
                message: err.response?.data?.Message || "Unable to update booking.",
                type: 'danger'
            });
        }
    };

    const deleteBookingRequest = async (bookingId) => {
        if (!window.confirm('Delete this booking request?')) return;

        try {
            const { data } = await axios.delete(`${baseURL}/api/bookings/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: data.Message, type: 'success' });
            fetchBookings();
            fetchProfile();
        } catch (err) {
            setToast({
                show: true,
                message: err.response?.data?.Message || "Unable to delete booking request.",
                type: 'danger'
            });
        }
    };

    const openChat = async (booking) => {
        try {
            setSelectedBooking(booking);
            setShowChatModal(true);
            const { data } = await axios.get(`${baseURL}/api/bookings/${booking._id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(data);
        } catch (err) {
            setShowChatModal(false);
            setToast({
                show: true,
                message: err.response?.data?.Message || "Unable to open chat.",
                type: 'danger'
            });
        }
    };

    const openProblemPhoto = (photo) => {
        setSelectedPhoto(photo);
        setShowPhotoModal(true);
    };

    const sendChatMessage = async (e) => {
        e.preventDefault();

        if (!chatText.trim() || !selectedBooking) return;

        try {
            setSendingMessage(true);
            const { data } = await axios.post(`${baseURL}/api/bookings/${selectedBooking._id}/messages`, {
                message: chatText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([...messages, data.chatMessage]);
            setChatText('');
        } catch (err) {
            setToast({
                show: true,
                message: err.response?.data?.Message || "Unable to send message.",
                type: 'danger'
            });
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const memberSince = data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A';
    const activityStats = activity || {
        totalRequests: 0,
        ongoingRequests: 0,
        completedRequests: 0,
        cancelledRequests: 0,
        totalPayment: 0,
        pendingPayment: 0
    };

    return (
        <Container className="py-5">
            <Row className="g-4">
                <Col lg={4}>
                    <div className="glass-card h-100">
                        <div className="d-flex justify-content-between align-items-start mb-4">
                            <div>
                                <div className="provider-avatar shadow-sm mb-3">
                                    {data?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <h3 className="fw-bold mb-1">{data?.name}</h3>
                                <p className="text-muted mb-0">{data?.email}</p>
                            </div>
                            <Badge bg={data?.role === 'admin' ? 'danger' : data?.role === 'provider' ? 'success' : 'primary'}>
                                {data?.role || 'user'}
                            </Badge>
                        </div>

                        <div className="border-top pt-3">
                            <p className="mb-2"><strong>Account type:</strong> {data?.role || 'customer'}</p>
                            <p className="mb-2"><strong>Total requests:</strong> {activityStats.totalRequests}</p>
                            <p className="mb-0"><strong>Member since:</strong> {memberSince}</p>
                        </div>

                        <div className="d-grid gap-2 mt-4">
                            <Button variant="outline-primary" onClick={() => setShowPasswordModal(true)}>
                                <FiEdit className="me-2" />
                                Edit Profile
                            </Button>
                            <Button variant="outline-secondary" onClick={() => document.getElementById('bookings-table')?.scrollIntoView({ behavior: 'smooth' })}>
                                <FiCalendar className="me-2" />
                                View Bookings
                            </Button>
                            <Button variant="outline-danger" onClick={handleLogout}>
                                <FiLogOut className="me-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </Col>

                <Col lg={8}>
                    <Row className="g-3 mb-4">
                        <Col md={4}>
                            <div className="glass-card text-center h-100">
                                <FiUser className="text-primary mb-2" size={28} />
                                <h3 className="fw-bold">{activityStats.ongoingRequests}</h3>
                                <p className="text-muted mb-0">Ongoing Req</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="glass-card text-center h-100">
                                <FiCheckCircle className="text-success mb-2" size={28} />
                                <h3 className="fw-bold">{activityStats.completedRequests}</h3>
                                <p className="text-muted mb-0">Completed Req</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="glass-card text-center h-100">
                                <FiXCircle className="text-danger mb-2" size={28} />
                                <h3 className="fw-bold">{activityStats.cancelledRequests}</h3>
                                <p className="text-muted mb-0">Cancelled Req</p>
                            </div>
                        </Col>
                    </Row>

                    <div className="glass-card mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FiCreditCard className="text-success" />
                            <h4 className="fw-bold mb-0">Payment Information</h4>
                        </div>
                        <Row>
                            <Col sm={6}>
                                <p className="text-muted mb-1">Total payment made</p>
                                <h4 className="fw-bold">Rs. {activityStats.totalPayment}</h4>
                            </Col>
                            <Col sm={6}>
                                <p className="text-muted mb-1">Pending payment</p>
                                <h4 className="fw-bold">Rs. {activityStats.pendingPayment}</h4>
                            </Col>
                        </Row>
                    </div>

                    <div className="glass-card" id="bookings-table">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold mb-0">Bookings</h4>
                            <Badge bg="primary">Total: {bookings.length}</Badge>
                        </div>
                        <Table responsive hover className="align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Provider</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length > 0 ? bookings.map((booking) => (
                                    <tr key={booking._id}>
                                        <td>{booking.serviceCategory}</td>
                                        <td>{booking.providerId?.name || 'N/A'}</td>
                                        <td>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}</td>
                                        <td><Badge bg={booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : 'warning'}>{booking.status}</Badge></td>
                                        <td>{booking.paymentStatus}</td>
                                        <td>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {data?.role === 'provider' && booking.status === 'Requested' && (
                                                    <Button size="sm" variant="success" onClick={() => updateBookingStatus(booking._id, 'Accepted')}>
                                                        Accept
                                                    </Button>
                                                )}
                                                {['Accepted', 'In-Progress', 'Completed'].includes(booking.status) && (
                                                    <Button size="sm" variant="outline-primary" onClick={() => openChat(booking)}>
                                                        <FiMessageCircle className="me-1" />
                                                        Chat
                                                    </Button>
                                                )}
                                                {booking.problemPhoto && (
                                                    <Button size="sm" variant="outline-secondary" onClick={() => openProblemPhoto(booking.problemPhoto)}>
                                                        <FiImage className="me-1" />
                                                        Photo
                                                    </Button>
                                                )}
                                                {data?.role === 'user' && booking.status === 'Requested' && (
                                                    <Button size="sm" variant="outline-danger" onClick={() => deleteBookingRequest(booking._id)}>
                                                        <FiTrash2 className="me-1" />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-4">No bookings yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Change Password</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handlePasswordSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Current Password</Form.Label>
                            <Form.Control
                                name="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                name="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                            <Form.Text className="text-muted">
                                Use 7+ characters with uppercase, number, and special character.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control
                                name="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowPasswordModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={savingPassword}>
                            {savingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showChatModal} onHide={() => setShowChatModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Chat for {selectedBooking?.serviceCategory}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="border rounded p-3 mb-3 bg-light" style={{ minHeight: '280px', maxHeight: '360px', overflowY: 'auto' }}>
                        {messages.length > 0 ? messages.map((item) => {
                            const isMine = item.senderId?.toString() === data?._id?.toString();
                            return (
                                <div key={item._id} className={`d-flex mb-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                    <div className={`p-2 rounded ${isMine ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '75%' }}>
                                        <div className="small fw-semibold mb-1">{isMine ? 'You' : item.senderRole}</div>
                                        <div>{item.message}</div>
                                        <div className={`small mt-1 ${isMine ? 'text-white-50' : 'text-muted'}`}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center text-muted py-5">No messages yet. Start the negotiation.</div>
                        )}
                    </div>
                    <Form onSubmit={sendChatMessage}>
                        <div className="d-flex gap-2">
                            <Form.Control
                                value={chatText}
                                onChange={(e) => setChatText(e.target.value)}
                                placeholder="Type your message"
                            />
                            <Button type="submit" disabled={sendingMessage || !chatText.trim()}>
                                <FiSend />
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Problem Picture</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPhoto ? (
                        <img src={selectedPhoto} alt="Uploaded problem" className="img-fluid rounded w-100" />
                    ) : (
                        <div className="text-center text-muted py-5">No picture available.</div>
                    )}
                </Modal.Body>
            </Modal>

            <ToastContainer position="bottom-end" className="p-3">
                <Toast bg={toast.type} show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3500} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </Container>
    )
}

export default Profile
