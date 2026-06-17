import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert, Badge, Button, Col, Container, Form, Row, Spinner, Toast, ToastContainer } from 'react-bootstrap'
import { FiCalendar, FiCheckCircle, FiDollarSign, FiEdit3, FiImage, FiMapPin, FiNavigation, FiSend, FiStar, FiTrendingUp, FiX } from 'react-icons/fi'
import { API_BASE_URL } from '../config/api'

const getTodayDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCompletionRate = (completionRate) => (
  completionRate === null || completionRate === undefined ? 'N/A' : `${completionRate}%`
);

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const baseURL = API_BASE_URL;
  const token = localStorage.getItem('token');
  const todayDateValue = getTodayDateValue();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatusKey, setLocationStatusKey] = useState(0);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [form, setForm] = useState({
    scheduledDate: '',
    description: '',
    latitude: '',
    longitude: '',
    mapUrl: '',
    problemPhoto: '',
    problemPhotoFile: null
  });

  useEffect(() => {
    fetchProvider();
  }, [id]);

  useEffect(() => {
    if (location?.state?.description) {
      setForm((current) => ({ ...current, description: location.state.description }));
    }
  }, [location]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000 });
          });
          params.append('latitude', position.coords.latitude);
          params.append('longitude', position.coords.longitude);
        } catch {
          // Distance is optional; provider details still load without browser location.
        }
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await axios.get(`${baseURL}/api/providers/${id}${query}`);
      setProvider(data.provider);
    } catch (err) {
      console.error(err);
      setError('Unable to load provider profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((current) => ({ ...current, problemPhoto: reader.result, problemPhotoFile: file }));
    };
    reader.readAsDataURL(file);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return setToast({ show: true, message: 'Location is not supported by this browser.', type: 'danger' });
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setForm((current) => ({
          ...current,
          latitude,
          longitude,
          mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
        }));
        setLocationStatusKey((current) => current + 1);
        setLocating(false);
        setToast({ show: true, message: 'Google Maps location added.', type: 'success' });
      },
      () => {
        setLocating(false);
        setToast({ show: true, message: 'Unable to get your location. Please allow location access.', type: 'danger' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRequest = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate('/login');
      return;
    }
    if (form.scheduledDate < todayDateValue) {
      setToast({ show: true, message: 'Please select today or a future date.', type: 'danger' });
      return;
    }
    if (!form.latitude || !form.longitude) {
      setToast({ show: true, message: 'Please add your Google Maps location before sending request.', type: 'danger' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('providerId', provider._id);
      payload.append('serviceCategory', provider.category);
      payload.append('scheduledDate', form.scheduledDate);
      payload.append('description', form.description);
      payload.append('charges', provider.charges);
      payload.append('address', JSON.stringify({
        latitude: form.latitude,
        longitude: form.longitude,
        mapUrl: form.mapUrl
      }));

      if (form.problemPhotoFile) {
        payload.append('problemPhoto', form.problemPhotoFile);
      }

      const { data } = await axios.post(`${baseURL}/api/bookings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setToast({ show: true, message: data.Message, type: 'success' });
      setTimeout(() => navigate('/profile'), 1400);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: err.response?.data?.Message || 'Unable to send request.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="py-5">
      <Row className="g-4">
        <Col lg={7}>
          <div className="glass-card h-100">
            <div className="d-flex align-items-center gap-4 mb-4">
              <div className="provider-avatar shadow-sm m-0">
                {provider.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="fw-bold mb-1">{provider.name}</h2>
                <Badge bg="light" text="dark" className="border">{provider.category}</Badge>
              </div>
            </div>

            <p className="text-muted">{provider.summary}</p>

            <Row className="g-3 my-4">
              <Col sm={6}>
                <div className="border rounded-3 p-3 bg-white h-100">
                  <FiStar className="text-warning me-2" />
                  <strong>{provider.rating}</strong>
                  <span className="text-muted ms-2">Rating</span>
                </div>
              </Col>
              <Col sm={6}>
                <div className="border rounded-3 p-3 bg-white h-100">
                  <FiTrendingUp className="text-primary me-2" />
                  <strong>{formatCompletionRate(provider.completionRate)}</strong>
                  <span className="text-muted ms-2">Completion</span>
                </div>
              </Col>
              <Col sm={6}>
                <div className="border rounded-3 p-3 bg-white h-100">
                  <FiDollarSign className="text-success me-2" />
                  <strong>Rs. {provider.charges}</strong>
                  <span className="text-muted ms-2">Charges</span>
                  {provider.travelFee > 0 && (
                    <div className="text-muted small mt-2">
                      Base Rs. {provider.baseCharges} + travel Rs. {provider.travelFee}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <h5 className="fw-bold">Skills</h5>
            <div className="d-flex gap-2 flex-wrap mb-4">
              {provider.skills.map((skill) => (
                <Badge bg="primary" key={skill} className="p-2">{skill}</Badge>
              ))}
            </div>

            <h5 className="fw-bold">Review Summary</h5>
            <p className="text-muted mb-3">
              {provider.reviewSummary || (provider.ratingCount > 0 ? `${provider.ratingCount} customer review${provider.ratingCount === 1 ? '' : 's'} recorded.` : 'No customer reviews yet.')}
            </p>
            {provider.recentReviews?.length > 0 && (
              <div className="d-flex flex-column gap-2">
                {provider.recentReviews.map((review) => (
                  <div className="border rounded-3 p-3 bg-white" key={review._id}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>{review.customerName}</strong>
                      <span className="text-warning fw-semibold">{review.rating}/5</span>
                    </div>
                    {review.comment && <p className="text-muted small mb-0">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>

        <Col lg={5}>
          <div className="glass-card">
            <h4 className="fw-bold mb-3">Request Service</h4>
            <Form onSubmit={handleRequest}>
              <Form.Group className="mb-3">
                <Form.Label>Preferred Date</Form.Label>
                <Form.Control name="scheduledDate" type="date" value={form.scheduledDate} min={todayDateValue} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Google Maps Location</Form.Label>
                {!form.mapUrl ? (
                  <Button type="button" variant="outline-primary" className="w-100" onClick={useCurrentLocation} disabled={locating}>
                    {locating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <FiNavigation className="me-2" />
                        Use My Current Location
                      </>
                    )}
                  </Button>
                ) : (
                  <div key={locationStatusKey} className="location-confirmation">
                    <div className="d-flex align-items-center gap-2">
                      <span className="location-check">
                        <FiCheckCircle />
                      </span>
                      <div>
                        <strong>Location Added</strong>
                        <div className="small text-muted">Your current Google Maps location is attached.</div>
                      </div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-3">
                      <Button as="a" href={form.mapUrl} target="_blank" rel="noreferrer" size="sm" variant="outline-primary">
                        <FiMapPin className="me-1" />
                        View Location
                      </Button>
                      <Button type="button" size="sm" variant="outline-secondary" onClick={useCurrentLocation} disabled={locating}>
                        {locating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <FiEdit3 className="me-1" />
                            Edit Location
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Problem Details</Form.Label>
                <Form.Control as="textarea" rows={4} name="description" value={form.description} onChange={handleChange} placeholder="Describe the service you need" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Object/Problem Picture</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handlePhotoChange} />
                <Form.Text className="text-muted">Optional. Upload a clear image up to 5MB.</Form.Text>
                {form.problemPhoto && (
                  <div className="border rounded mt-3 p-2 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted d-flex align-items-center gap-1">
                        <FiImage /> Preview
                      </span>
                      <Button size="sm" variant="outline-danger" onClick={() => setForm({ ...form, problemPhoto: '', problemPhotoFile: null })}>
                        <FiX />
                      </Button>
                    </div>
                    <img src={form.problemPhoto} alt="Problem preview" className="img-fluid rounded" style={{ maxHeight: '220px', objectFit: 'cover', width: '100%' }} />
                  </div>
                )}
              </Form.Group>
              <div className="d-flex align-items-center gap-2 text-muted mb-3">
                <FiCalendar />
                Request will be sent to the provider for acceptance.
              </div>
              <Button type="submit" className="btn-primary-custom w-100" disabled={submitting}>
                {submitting ? (
                  'Sending...'
                ) : (
                  <>
                    <FiSend className="me-2" />
                    Send Request
                  </>
                )}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast bg={toast.type} show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide>
          <Toast.Body className="text-white">
            <FiCheckCircle className="me-2" />
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  )
}

export default Detail
