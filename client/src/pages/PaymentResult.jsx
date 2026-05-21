import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentResult = ({ cancelled = false }) => {
    const [status, setStatus] = useState(cancelled ? 'cancelled' : 'checking');
    const [message, setMessage] = useState(cancelled ? 'Payment was cancelled.' : 'Confirming your payment...');
    const location = useLocation();
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_APP_URL;

    useEffect(() => {
        if (cancelled) return;

        const confirmPayment = async () => {
            const params = new URLSearchParams(location.search);
            const tracker = params.get('tracker');
            const token = localStorage.getItem('token');

            if (!tracker) {
                setStatus('failed');
                setMessage('Safepay did not return a payment tracker.');
                return;
            }

            try {
                const { data } = await axios.get(`${baseURL}/api/bookings/safepay/confirm`, {
                    params: { tracker },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStatus(data.paymentConfirmed ? 'success' : 'pending');
                setMessage(data.Message);
            } catch (err) {
                setStatus('failed');
                setMessage(err.response?.data?.Message || 'Unable to confirm payment.');
            }
        };

        confirmPayment();
    }, [baseURL, cancelled, location.search]);

    const variant = status === 'success' ? 'success' : status === 'failed' ? 'danger' : status === 'cancelled' ? 'warning' : 'info';

    return (
        <Container className="py-5">
            <div className="glass-card mx-auto" style={{ maxWidth: '620px' }}>
                <Alert variant={variant} className="mb-4">
                    {status === 'checking' && <Spinner animation="border" size="sm" className="me-2" />}
                    {message}
                </Alert>
                <Button onClick={() => navigate('/my-bookings')}>
                    Back to Bookings
                </Button>
            </div>
        </Container>
    );
};

export default PaymentResult;
