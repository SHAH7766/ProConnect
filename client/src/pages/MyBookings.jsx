import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Badge, Button, Container, Form, Modal, Spinner, Table, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft, FiImage, FiMapPin, FiMessageCircle, FiSend, FiStar, FiTrash2 } from 'react-icons/fi';

const getChatSeenKey = (userId, bookingId) => `chatLastSeen:${userId}:${bookingId}`;

const MyBookings = () => {
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_APP_URL;

    useEffect(() => {
        fetchProfile();
        fetchBookings();
    }, [token]);

    useEffect(() => {
        if (!showChatModal || !selectedBooking) return;

        const intervalId = setInterval(() => {
            fetchMessages(selectedBooking._id, false).then((chatMessages) => {
                markChatAsRead(selectedBooking._id, chatMessages);
            });
        }, 3000);

        return () => clearInterval(intervalId);
    }, [showChatModal, selectedBooking?._id, profile?._id]);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(data.profile);
        } catch (err) {
            console.error("Profile fetch error:", err);
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
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (bookingId, status) => {
        try {
            const { data } = await axios.put(`${baseURL}/api/bookings/${bookingId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: data.Message, type: 'success' });
            fetchBookings();
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.Message || "Unable to update booking.", type: 'danger' });
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
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.Message || "Unable to delete booking request.", type: 'danger' });
        }
    };

    const fetchMessages = async (bookingId, showErrors = true) => {
        try {
            const { data } = await axios.get(`${baseURL}/api/bookings/${bookingId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(data);
            return data;
        } catch (err) {
            if (showErrors) {
                setShowChatModal(false);
                setToast({ show: true, message: err.response?.data?.Message || "Unable to open chat.", type: 'danger' });
            }
            return [];
        }
    };

    const markChatAsRead = (bookingId, chatMessages = []) => {
        const incomingMessages = chatMessages.filter((item) => item.senderId?.toString() !== profile?._id?.toString());
        const latestIncoming = incomingMessages[incomingMessages.length - 1];
        if (profile?._id && latestIncoming?.createdAt) {
            localStorage.setItem(getChatSeenKey(profile._id, bookingId), latestIncoming.createdAt);
        }
    };

    const openChat = async (booking) => {
        setSelectedBooking(booking);
        setShowChatModal(true);
        const chatMessages = await fetchMessages(booking._id);
        markChatAsRead(booking._id, chatMessages);
    };

    const replaceMessage = (tempId, nextMessage) => {
        setMessages((current) => current.map((item) => item._id === tempId ? nextMessage : item));
    };

    const removeMessage = (tempId) => {
        setMessages((current) => current.filter((item) => item._id !== tempId));
    };

    const addMessageIfMissing = (nextMessage) => {
        setMessages((current) => {
            if (current.some((item) => item._id === nextMessage._id)) return current;
            return [...current, nextMessage];
        });
    };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        const trimmedMessage = chatText.trim();
        if (!trimmedMessage || !selectedBooking) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            bookingId: selectedBooking._id,
            senderId: profile?._id,
            senderRole: profile?.role,
            message: trimmedMessage,
            createdAt: new Date().toISOString(),
            pending: true
        };

        setChatText('');
        addMessageIfMissing(optimisticMessage);

        try {
            setSendingMessage(true);
            const { data } = await axios.post(`${baseURL}/api/bookings/${selectedBooking._id}/messages`, {
                message: trimmedMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            replaceMessage(tempId, data.chatMessage);
        } catch (err) {
            removeMessage(tempId);
            setChatText(trimmedMessage);
            setToast({ show: true, message: err.response?.data?.Message || "Unable to send message.", type: 'danger' });
        } finally {
            setSendingMessage(false);
        }
    };

    const openReview = (booking) => {
        setSelectedBooking(booking);
        setReviewForm({ rating: '5', comment: '' });
        setShowReviewModal(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!selectedBooking) return;

        try {
            setSubmittingReview(true);
            const { data } = await axios.post(`${baseURL}/api/bookings/${selectedBooking._id}/review`, reviewForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: data.Message, type: 'success' });
            setBookings(bookings.map((booking) => booking._id === selectedBooking._id ? { ...booking, hasReview: true } : booking));
            setShowReviewModal(false);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.Message || "Unable to submit review.", type: 'danger' });
        } finally {
            setSubmittingReview(false);
        }
    };

    const openProblemPhoto = (photo) => {
        setSelectedPhoto(photo);
        setShowPhotoModal(true);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container className="py-5">
            <Button variant="link" className="px-0 mb-3 fw-semibold text-decoration-none" onClick={() => navigate('/profile')}>
                <FiArrowLeft className="me-2" />
                Back to Profile
            </Button>

            <div className="glass-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="fw-bold mb-0">My Bookings</h3>
                    <Badge bg="primary">Total: {bookings.length}</Badge>
                </div>
                <Table responsive hover className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>{profile?.role === 'provider' ? 'Customer' : 'Provider'}</th>
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
                                <td>{profile?.role === 'provider' ? booking.customerId?.name || 'N/A' : booking.providerId?.name || 'N/A'}</td>
                                <td>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}</td>
                                <td><Badge bg={booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : 'warning'}>{booking.status}</Badge></td>
                                <td>{booking.paymentStatus}</td>
                                <td>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {profile?.role === 'provider' && booking.status === 'Requested' && (
                                            <Button size="sm" variant="success" onClick={() => updateBookingStatus(booking._id, 'Accepted')}>Accept</Button>
                                        )}
                                        {profile?.role === 'provider' && booking.status === 'Accepted' && (
                                            <Button size="sm" variant="primary" onClick={() => updateBookingStatus(booking._id, 'In-Progress')}>Start</Button>
                                        )}
                                        {profile?.role === 'provider' && booking.status === 'In-Progress' && (
                                            <Button size="sm" variant="success" onClick={() => updateBookingStatus(booking._id, 'Completed')}>Complete</Button>
                                        )}
                                        {['Accepted', 'In-Progress'].includes(booking.status) && (
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
                                        {booking.address?.mapUrl && booking.status !== 'Completed' && (
                                            <Button as="a" href={booking.address.mapUrl} target="_blank" rel="noreferrer" size="sm" variant="outline-success">
                                                <FiMapPin className="me-1" />
                                                Map
                                            </Button>
                                        )}
                                        {profile?.role === 'user' && booking.status === 'Requested' && (
                                            <Button size="sm" variant="outline-danger" onClick={() => deleteBookingRequest(booking._id)}>
                                                <FiTrash2 className="me-1" />
                                                Delete
                                            </Button>
                                        )}
                                        {profile?.role === 'user' && booking.providerId?._id && (
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => navigate('/complain', {
                                                    state: {
                                                        providerId: booking.providerId._id,
                                                        providerName: booking.providerId.name,
                                                        bookingId: booking._id,
                                                        serviceCategory: booking.serviceCategory
                                                    }
                                                })}
                                            >
                                                <FiAlertTriangle className="me-1" />
                                                Complain
                                            </Button>
                                        )}
                                        {profile?.role === 'user' && booking.status === 'Completed' && !booking.hasReview && (
                                            <Button size="sm" variant="outline-warning" onClick={() => openReview(booking)}>
                                                <FiStar className="me-1" />
                                                Review
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

            <Modal show={showChatModal} onHide={() => setShowChatModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chat for {selectedBooking?.serviceCategory}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="border rounded p-3 mb-3 bg-light" style={{ minHeight: '280px', maxHeight: '360px', overflowY: 'auto' }}>
                        {messages.length > 0 ? messages.map((item) => {
                            const isMine = item.senderId?.toString() === profile?._id?.toString();
                            return (
                                <div key={item._id} className={`d-flex mb-2 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                                    <div className={`p-2 rounded ${isMine ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '75%' }}>
                                        <div className="small fw-semibold mb-1">{isMine ? 'You' : item.senderRole}</div>
                                        <div>{item.message}</div>
                                        <div className={`small mt-1 ${isMine ? 'text-white-50' : 'text-muted'}`}>
                                            {item.pending ? 'Sending...' : item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
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
                            <Form.Control value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Type your message" />
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

            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Rate Provider</Modal.Title>
                </Modal.Header>
                <Form onSubmit={submitReview}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Rating</Form.Label>
                            <Form.Select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Bad</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Comment</Form.Label>
                            <Form.Control as="textarea" rows={3} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
                        <Button type="submit" variant="warning" disabled={submittingReview}>
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <ToastContainer position="bottom-end" className="p-3">
                <Toast bg={toast.type} show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3500} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </Container>
    )
}

export default MyBookings
