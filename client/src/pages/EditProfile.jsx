import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Badge, Button, Col, Container, Form, Row, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiLock, FiPhone } from 'react-icons/fi';

const EditProfile = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingContact, setSavingContact] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [contactForm, setContactForm] = useState({
        email: '',
        phone: ''
    });
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
    }, [token]);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/api/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(data.profile);
            setContactForm({
                email: data.profile?.email || '',
                phone: data.profile?.phone || ''
            });
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    };

    const handleContactChange = (e) => {
        setContactForm({ ...contactForm, [e.target.name]: e.target.value });
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();

        try {
            setSavingContact(true);
            const { data } = await axios.put(`${baseURL}/api/profile/contact`, contactForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData((current) => ({
                ...current,
                email: data.profile?.email || contactForm.email,
                phone: data.profile?.phone || contactForm.phone
            }));
            setToast({ show: true, message: data.Message, type: 'success' });
        } catch (err) {
            setToast({
                show: true,
                message: err.response?.data?.Message || "Unable to update contact details.",
                type: 'danger'
            });
        } finally {
            setSavingContact(false);
        }
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
            <Row className="g-4 justify-content-center">
                <Col lg={5}>
                    <div className="glass-card h-100">
                        <div className="provider-avatar shadow-sm mb-3">
                            {data?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <h3 className="fw-bold mb-1">{data?.name}</h3>
                        <p className="text-muted mb-3">{data?.email}</p>
                        {data?.phone && <p className="text-muted mb-3">{data.phone}</p>}
                        <Badge bg={data?.role === 'admin' ? 'danger' : data?.role === 'provider' ? 'success' : 'primary'}>
                            {data?.role || 'user'}
                        </Badge>
                    </div>
                </Col>

                <Col lg={7}>
                    <div className="glass-card mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FiMail className="text-primary" />
                            <h4 className="fw-bold mb-0">Change Email</h4>
                        </div>
                        <Form onSubmit={handleContactSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control name="email" type="email" value={contactForm.email} onChange={handleContactChange} required />
                            </Form.Group>
                            <Button type="submit" className="btn-primary-custom" disabled={savingContact}>
                                {savingContact ? 'Updating...' : 'Update Email'}
                            </Button>
                        </Form>
                    </div>

                    <div className="glass-card mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FiPhone className="text-success" />
                            <h4 className="fw-bold mb-0">Change Phone Number</h4>
                        </div>
                        <Form onSubmit={handleContactSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control name="phone" type="tel" value={contactForm.phone} onChange={handleContactChange} placeholder="Phone number for calls" />
                            </Form.Group>
                            <Button type="submit" className="btn-primary-custom" disabled={savingContact}>
                                {savingContact ? 'Updating...' : 'Update Phone'}
                            </Button>
                        </Form>
                    </div>

                    <div className="glass-card">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <FiLock className="text-primary" />
                            <h4 className="fw-bold mb-0">Change Password</h4>
                        </div>
                        <Form onSubmit={handlePasswordSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Current Password</Form.Label>
                                <Form.Control name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>New Password</Form.Label>
                                <Form.Control name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
                                <Form.Text className="text-muted">
                                    Use 7+ characters with uppercase, number, and special character.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Confirm New Password</Form.Label>
                                <Form.Control name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
                            </Form.Group>
                            <Button type="submit" className="btn-primary-custom" disabled={savingPassword}>
                                {savingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                        </Form>
                    </div>
                </Col>
            </Row>

            <ToastContainer position="bottom-end" className="p-3">
                <Toast bg={toast.type} show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3500} autohide>
                    <Toast.Body className="text-white">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>
        </Container>
    )
}

export default EditProfile
