import express from 'express'
import { ConfirmSafepayPayment, CreateBooking, CreateSafepayCheckout, DeleteBookingRequest, GetBookingMessages, GetLatestIncomingChatMessages, GetMyBookings, GetProviderDetails, ReviewBooking, SearchProviders, SendBookingMessage, UpdateBookingStatus } from "../Controllers/BookingController.js"
import { VerifyToken } from "../Middleware/validator.js"
import { upload, uploadAudio } from "../Middleware/upload.js"

const BookingRouter = express.Router()

const handleUploadError = (middleware) => (req, res, next) => {
    middleware(req, res, (error) => {
        if (error) {
            return res.status(400).send({ Message: error.message, success: false })
        }

        next()
    })
}

BookingRouter.get("/providers/search", SearchProviders)
BookingRouter.get("/providers/:id", GetProviderDetails)
BookingRouter.post("/bookings", VerifyToken, handleUploadError(upload.single('problemPhoto')), CreateBooking)
BookingRouter.get("/mybookings", VerifyToken, GetMyBookings)
BookingRouter.get("/bookings/chat/latest", VerifyToken, GetLatestIncomingChatMessages)
BookingRouter.delete("/bookings/:id", VerifyToken, DeleteBookingRequest)
BookingRouter.put("/bookings/:id/status", VerifyToken, UpdateBookingStatus)
BookingRouter.post("/bookings/:id/safepay/checkout", VerifyToken, CreateSafepayCheckout)
BookingRouter.get("/bookings/safepay/confirm", VerifyToken, ConfirmSafepayPayment)
BookingRouter.get("/bookings/:id/messages", VerifyToken, GetBookingMessages)
BookingRouter.post("/bookings/:id/messages", VerifyToken, handleUploadError(uploadAudio.single('voiceMessage')), SendBookingMessage)
BookingRouter.post("/bookings/:id/review", VerifyToken, ReviewBooking)

export default BookingRouter;
