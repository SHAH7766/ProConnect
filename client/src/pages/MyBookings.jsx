import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Badge, Button, Container, Form, Modal, Spinner, Table, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowLeft, FiImage, FiMapPin, FiMessageCircle, FiMic, FiSend, FiSquare, FiStar, FiTrash2, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../config/api';

const getChatSeenKey = (userId, bookingId) => `chatLastSeen:${userId}:${bookingId}`;

const getErrorMessage = (err, fallback) => {
    const responseMessage = err.response?.data?.Message || err.response?.data?.message;
    if (responseMessage) return responseMessage;
    if (typeof err.response?.data === 'string' && err.response.data.trim()) return err.response.data;
    if (err.response?.status) return `${fallback} Server returned ${err.response.status}.`;
    return fallback;
};

const MyBookings = () => {
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChatModal, setShowChatModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState('');
    const [selectedPhotoTitle, setSelectedPhotoTitle] = useState('Photo');
    const [messages, setMessages] = useState([]);
    const [chatText, setChatText] = useState('');
    const [voiceBlob, setVoiceBlob] = useState(null);
    const [voicePreviewUrl, setVoicePreviewUrl] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [submittingCompletion, setSubmittingCompletion] = useState(false);
    const [releasingPayment, setReleasingPayment] = useState(false);
    const [deletingAllBookings, setDeletingAllBookings] = useState(false);
    const [payingBookingId, setPayingBookingId] = useState('');
    const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });
    const [providerAccountNumber, setProviderAccountNumber] = useState('');
    const [completionPhoto, setCompletionPhoto] = useState(null);
    const [completionPreview, setCompletionPreview] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const baseURL = API_BASE_URL;
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const voicePreviewUrlRef = useRef('');

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

    useEffect(() => {
        voicePreviewUrlRef.current = voicePreviewUrl;
    }, [voicePreviewUrl]);

    useEffect(() => {
        return () => {
            if (voicePreviewUrlRef.current) URL.revokeObjectURL(voicePreviewUrlRef.current);
            mediaRecorderRef.current?.stream?.getTracks()?.forEach((track) => track.stop());
        };
    }, []);

    useEffect(() => {
        return () => {
            if (completionPreview) URL.revokeObjectURL(completionPreview);
        };
    }, [completionPreview]);

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

    const updatePaymentStatus = async (bookingId, paymentStatus, successMessage, extraPayload = {}) => {
        try {
            const { data } = await axios.put(`${baseURL}/api/bookings/${bookingId}/status`, { paymentStatus, ...extraPayload }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: data.Message || successMessage, type: 'success' });
            fetchBookings();
            return true;
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.Message || "Unable to update payment.", type: 'danger' });
            return false;
        }
    };

    const startSafepayCheckout = async (bookingId) => {
        try {
            setPayingBookingId(bookingId);
            const { data } = await axios.post(`${baseURL}/api/bookings/${bookingId}/safepay/checkout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = data.checkoutUrl;
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.Message || "Unable to start Safepay checkout.", type: 'danger' });
            setPayingBookingId('');
        }
    };

    const releaseBookingPayment = (booking) => {
        setSelectedBooking(booking);
        setProviderAccountNumber('');
        setShowReleaseModal(true);
    };

    const closeReleaseModal = () => {
        if (releasingPayment) return;

        setShowReleaseModal(false);
        setProviderAccountNumber('');
    };

    const submitReleasePayment = async (e) => {
        e.preventDefault();
        const trimmedAccountNumber = providerAccountNumber.trim();

        if (!selectedBooking || !trimmedAccountNumber) {
            setToast({ show: true, message: 'Please enter the provider account number.', type: 'danger' });
            return;
        }

        try {
            setReleasingPayment(true);
            const wasReleased = await updatePaymentStatus(selectedBooking._id, 'Released', "Payment released to provider.", {
                providerAccountNumber: trimmedAccountNumber
            });
            if (wasReleased) closeReleaseModal();
        } finally {
            setReleasingPayment(false);
        }
    };

    const openCompletionProof = (booking) => {
        setSelectedBooking(booking);
        setCompletionPhoto(null);
        setCompletionPreview('');
        setShowCompletionModal(true);
    };

    const closeCompletionProof = () => {
        setShowCompletionModal(false);
        setCompletionPhoto(null);
        setCompletionPreview('');
    };

    const handleCompletionPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setToast({ show: true, message: 'Please select an image file.', type: 'danger' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setToast({ show: true, message: 'Image must be 5MB or smaller.', type: 'danger' });
            return;
        }

        if (completionPreview) URL.revokeObjectURL(completionPreview);
        setCompletionPhoto(file);
        setCompletionPreview(URL.createObjectURL(file));
    };

    const submitCompletionProof = async (e) => {
        e.preventDefault();
        if (!selectedBooking || !completionPhoto) {
            setToast({ show: true, message: 'Please upload a completion proof photo.', type: 'danger' });
            return;
        }

        try {
            setSubmittingCompletion(true);
            const payload = new FormData();
            payload.append('completionPhoto', completionPhoto);

            const { data } = await axios.put(`${baseURL}/api/bookings/${selectedBooking._id}/complete`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setToast({ show: true, message: data.Message, type: 'success' });
            closeCompletionProof();
            fetchBookings();
        } catch (err) {
            setToast({ show: true, message: getErrorMessage(err, "Unable to submit completion proof."), type: 'danger' });
        } finally {
            setSubmittingCompletion(false);
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

    const deleteAllBookings = async () => {
        if (!isAdmin || bookings.length === 0) return;
        if (!window.confirm(`Delete all ${bookings.length} bookings? This cannot be undone.`)) return;

        try {
            setDeletingAllBookings(true);
            const { data } = await axios.delete(`${baseURL}/api/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setToast({ show: true, message: data.Message || 'All bookings deleted successfully.', type: 'success' });
            setBookings([]);
        } catch (err) {
            setToast({ show: true, message: err.response?.data?.Message || "Unable to delete all bookings.", type: 'danger' });
        } finally {
            setDeletingAllBookings(false);
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

    const getMessageSenderName = (item) => {
        const senderId = item.senderId?.toString();
        if (senderId === profile?._id?.toString()) return 'You';
        if (senderId === selectedBooking?.providerId?._id?.toString()) return selectedBooking.providerId.name || 'Provider';
        if (senderId === selectedBooking?.customerId?._id?.toString()) return selectedBooking.customerId.name || 'Customer';
        return item.senderRole === 'provider' ? 'Provider' : item.senderRole === 'user' ? 'Customer' : 'Admin';
    };

    const clearVoicePreview = () => {
        if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
        setVoiceBlob(null);
        setVoicePreviewUrl('');
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            setToast({ show: true, message: "Voice recording is not supported by this browser.", type: 'danger' });
            return;
        }

        try {
            clearVoicePreview();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorderOptions = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? { mimeType: 'audio/webm;codecs=opus' }
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? { mimeType: 'audio/webm' }
                    : {};
            const mediaRecorder = new MediaRecorder(stream, recorderOptions);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                setVoiceBlob(audioBlob);
                setVoicePreviewUrl(URL.createObjectURL(audioBlob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error(err);
            setToast({ show: true, message: "Unable to access microphone. Please allow microphone permission.", type: 'danger' });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        const trimmedMessage = chatText.trim();
        if ((!trimmedMessage && !voiceBlob) || !selectedBooking) return;

        const uploadVoiceBlob = voiceBlob
            ? new Blob([voiceBlob], { type: voiceBlob.type?.split(';')[0] || 'audio/webm' })
            : null;
        const tempId = `temp-${Date.now()}`;
        const previewUrl = voicePreviewUrl;
        const optimisticMessage = {
            _id: tempId,
            bookingId: selectedBooking._id,
            senderId: profile?._id,
            senderRole: profile?.role,
            message: trimmedMessage,
            audioUrl: previewUrl,
            createdAt: new Date().toISOString(),
            pending: true
        };

        setChatText('');
        setVoiceBlob(null);
        setVoicePreviewUrl('');
        addMessageIfMissing(optimisticMessage);

        try {
            setSendingMessage(true);
            const payload = new FormData();
            payload.append('message', trimmedMessage);
            if (uploadVoiceBlob) {
                payload.append('voiceMessage', uploadVoiceBlob, `voice-${Date.now()}.webm`);
            }

            const { data } = await axios.post(`${baseURL}/api/bookings/${selectedBooking._id}/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            replaceMessage(tempId, data.chatMessage);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        } catch (err) {
            removeMessage(tempId);
            setChatText(trimmedMessage);
            if (previewUrl) {
                setVoiceBlob(voiceBlob);
                setVoicePreviewUrl(previewUrl);
            }
            setToast({ show: true, message: err.response?.data?.Message || err.message || "Unable to send message.", type: 'danger' });
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

    const openProblemPhoto = (photo, title = 'Problem Picture') => {
        setSelectedPhoto(photo);
        setSelectedPhotoTitle(title);
        setShowPhotoModal(true);
    };

    const getPaymentBadgeVariant = (paymentStatus) => {
        if (paymentStatus === 'Released') return 'success';
        if (paymentStatus === 'Paid') return 'info';
        if (paymentStatus === 'Refunded') return 'danger';
        return 'secondary';
    };

    const getPaymentLabel = (paymentStatus) => {
        if (paymentStatus === 'Paid') return 'Paid - Held';
        if (paymentStatus === 'Released') return 'Released';
        return paymentStatus;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const isAdmin = profile?.role === 'admin';

    return (
        <Container className="py-5">
            <Button variant="link" className="px-0 mb-3 fw-semibold text-decoration-none" onClick={() => navigate('/profile')}>
                <FiArrowLeft className="me-2" />
                Back to Profile
            </Button>

            <div className="glass-card">
                <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
                    <h3 className="fw-bold mb-0">{isAdmin ? 'All Bookings' : 'My Bookings'}</h3>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Badge bg="primary">Total: {bookings.length}</Badge>
                        {isAdmin && (
                            <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={deleteAllBookings}
                                disabled={deletingAllBookings || bookings.length === 0}
                            >
                                <FiTrash2 className="me-1" />
                                {deletingAllBookings ? 'Deleting...' : 'Delete All'}
                            </Button>
                        )}
                    </div>
                </div>
                <Table responsive hover className="align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Service</th>
                            {isAdmin ? (
                                <>
                                    <th>Customer</th>
                                    <th>Provider</th>
                                </>
                            ) : (
                                <th>{profile?.role === 'provider' ? 'Customer' : 'Provider'}</th>
                            )}
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
                                {isAdmin ? (
                                    <>
                                        <td>{booking.customerId?.name || 'N/A'}</td>
                                        <td>{booking.providerId?.name || 'N/A'}</td>
                                    </>
                                ) : (
                                    <td>{profile?.role === 'provider' ? booking.customerId?.name || 'N/A' : booking.providerId?.name || 'N/A'}</td>
                                )}
                                <td>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}</td>
                                <td><Badge bg={booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : 'warning'}>{booking.status}</Badge></td>
                                <td><Badge bg={getPaymentBadgeVariant(booking.paymentStatus)}>{getPaymentLabel(booking.paymentStatus)}</Badge></td>
                                <td>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {profile?.role === 'provider' && booking.status === 'Requested' && (
                                            <Button size="sm" variant="success" onClick={() => updateBookingStatus(booking._id, 'Accepted')}>Accept</Button>
                                        )}
                                        {profile?.role === 'provider' && booking.status === 'Accepted' && ['Paid', 'Released'].includes(booking.paymentStatus) && (
                                            <Button size="sm" variant="primary" onClick={() => updateBookingStatus(booking._id, 'In-Progress')}>Start</Button>
                                        )}
                                        {profile?.role === 'provider' && booking.status === 'Accepted' && !['Paid', 'Released'].includes(booking.paymentStatus) && (
                                            <Badge bg="secondary" className="align-self-center">Waiting for payment</Badge>
                                        )}
                                        {profile?.role === 'provider' && booking.status === 'In-Progress' && (
                                            <Button size="sm" variant="success" onClick={() => openCompletionProof(booking)}>Complete Work</Button>
                                        )}
                                        {profile?.role === 'user' && booking.status === 'Accepted' && booking.paymentStatus !== 'Paid' && (
                                            <Button size="sm" variant="warning" onClick={() => startSafepayCheckout(booking._id)} disabled={payingBookingId === booking._id}>
                                                {payingBookingId === booking._id ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                        Opening...
                                                    </>
                                                ) : (
                                                    'Pay Now'
                                                )}
                                            </Button>
                                        )}
                                        {isAdmin && booking.status === 'Completed' && booking.paymentStatus === 'Paid' && (
                                            <Button size="sm" variant="success" onClick={() => releaseBookingPayment(booking)}>
                                                Release Payment
                                            </Button>
                                        )}
                                        {['Accepted', 'In-Progress'].includes(booking.status) && ['Paid', 'Released'].includes(booking.paymentStatus) && (
                                            <Button size="sm" variant="outline-primary" onClick={() => openChat(booking)}>
                                                <FiMessageCircle className="me-1" />
                                                Chat
                                            </Button>
                                        )}
                                        {booking.problemPhoto && (
                                            <Button size="sm" variant="outline-secondary" onClick={() => openProblemPhoto(booking.problemPhoto, 'Problem Picture')}>
                                                <FiImage className="me-1" />
                                                Photo
                                            </Button>
                                        )}
                                        {booking.completionPhoto && (
                                            <Button size="sm" variant="outline-info" onClick={() => openProblemPhoto(booking.completionPhoto, 'Completion Proof')}>
                                                <FiImage className="me-1" />
                                                Proof
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
                                        {profile?.role === 'user' && booking.providerId?._id && booking.status === 'Completed' && (
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
                                <td colSpan={isAdmin ? 7 : 6} className="text-center text-muted py-4">No bookings yet.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <Modal show={showReleaseModal} onHide={closeReleaseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Release Payment</Modal.Title>
                </Modal.Header>
                <Form onSubmit={submitReleasePayment}>
                    <Modal.Body>
                        <p className="text-muted mb-3">
                            Enter the provider account number before releasing payment to {selectedBooking?.providerId?.name || 'the provider'}.
                        </p>
                        <Form.Group>
                            <Form.Label>Provider account number</Form.Label>
                            <Form.Control
                                value={providerAccountNumber}
                                onChange={(e) => setProviderAccountNumber(e.target.value)}
                                placeholder="Account number or IBAN"
                                minLength={6}
                                maxLength={34}
                                required
                                autoFocus
                            />
                            <Form.Text className="text-muted">
                                Use 6 to 34 letters or numbers. Spaces and hyphens are allowed.
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={closeReleaseModal} disabled={releasingPayment}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={releasingPayment || !providerAccountNumber.trim()}>
                            {releasingPayment ? 'Releasing...' : 'Release Payment'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

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
                                        <div className="small fw-semibold mb-1">{getMessageSenderName(item)}</div>
                                        {item.message && <div>{item.message}</div>}
                                        {item.audioUrl && (
                                            <audio
                                                controls
                                                controlsList="nodownload noplaybackrate"
                                                disablePictureInPicture
                                                onContextMenu={(e) => e.preventDefault()}
                                                src={item.audioUrl}
                                                className="chat-audio-player mt-2"
                                            >
                                                Your browser does not support audio playback.
                                            </audio>
                                        )}
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
                        {voicePreviewUrl && (
                            <div className="voice-preview mb-2">
                                <audio
                                    controls
                                    controlsList="nodownload noplaybackrate"
                                    disablePictureInPicture
                                    onContextMenu={(e) => e.preventDefault()}
                                    src={voicePreviewUrl}
                                    className="chat-audio-player"
                                />
                                <Button type="submit" size="sm" variant="primary" disabled={sendingMessage}>
                                    <FiSend className="me-1" />
                                    Send Voice
                                </Button>
                                <Button type="button" size="sm" variant="outline-danger" onClick={clearVoicePreview} disabled={sendingMessage}>
                                    <FiX />
                                </Button>
                            </div>
                        )}
                        <div className="d-flex gap-2">
                            <Form.Control value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Type your message" />
                            {isRecording ? (
                                <Button type="button" variant="danger" onClick={stopRecording}>
                                    <FiSquare />
                                </Button>
                            ) : (
                                <Button type="button" variant="outline-primary" onClick={startRecording} disabled={sendingMessage}>
                                    <FiMic />
                                </Button>
                            )}
                            <Button type="submit" disabled={sendingMessage || (!chatText.trim() && !voiceBlob)}>
                                <FiSend />
                            </Button>
                        </div>
                        {isRecording && <div className="recording-hint mt-2">Recording voice message...</div>}
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedPhotoTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPhoto ? (
                        <img src={selectedPhoto} alt={selectedPhotoTitle} className="img-fluid rounded w-100" />
                    ) : (
                        <div className="text-center text-muted py-5">No picture available.</div>
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showCompletionModal} onHide={closeCompletionProof} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Submit Completion Proof</Modal.Title>
                </Modal.Header>
                <Form onSubmit={submitCompletionProof}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Completion photo</Form.Label>
                            <Form.Control type="file" accept="image/*" onChange={handleCompletionPhotoChange} required />
                            <Form.Text className="text-muted">
                                Upload a clear photo showing the completed work for admin review.
                            </Form.Text>
                        </Form.Group>
                        {completionPreview && (
                            <div className="border rounded p-2 bg-white">
                                <img src={completionPreview} alt="Completion preview" className="img-fluid rounded w-100" style={{ maxHeight: '260px', objectFit: 'cover' }} />
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={closeCompletionProof}>Cancel</Button>
                        <Button type="submit" variant="success" disabled={submittingCompletion || !completionPhoto}>
                            {submittingCompletion ? 'Submitting...' : 'Submit for Review'}
                        </Button>
                    </Modal.Footer>
                </Form>
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
