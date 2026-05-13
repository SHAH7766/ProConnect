import express from 'express'
import { CreateBooking, DeleteBookingRequest, GetBookingMessages, GetLatestIncomingChatMessages, GetMyBookings, GetProviderDetails, ReviewBooking, SearchProviders, SendBookingMessage, UpdateBookingStatus } from "../Controllers/BookingController.js"
import { VerifyToken } from "../Middleware/validator.js"
import { upload, uploadAudio } from "../Middleware/upload.js"

const BookingRouter = express.Router()

BookingRouter.get("/providers/search", SearchProviders)
BookingRouter.get("/providers/:id", GetProviderDetails)
BookingRouter.post("/bookings", VerifyToken, upload.single('problemPhoto'), CreateBooking)
BookingRouter.get("/mybookings", VerifyToken, GetMyBookings)
BookingRouter.get("/bookings/chat/latest", VerifyToken, GetLatestIncomingChatMessages)
BookingRouter.delete("/bookings/:id", VerifyToken, DeleteBookingRequest)
BookingRouter.put("/bookings/:id/status", VerifyToken, UpdateBookingStatus)
BookingRouter.get("/bookings/:id/messages", VerifyToken, GetBookingMessages)
BookingRouter.post("/bookings/:id/messages", VerifyToken, uploadAudio.single('voiceMessage'), SendBookingMessage)
BookingRouter.post("/bookings/:id/review", VerifyToken, ReviewBooking)

export default BookingRouter;
