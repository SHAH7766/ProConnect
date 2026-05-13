import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'provider',
    required: true
  },
  serviceCategory: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  address: {
    street: String,
    city: String,
    area: String,
    latitude: Number,
    longitude: Number,
    mapUrl: String,
  },
  charges: {
    type: Number,
    default: 0
  },
  problemPhoto: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'In-Progress', 'Completed', 'Cancelled', 'Disputed'],
    default: 'Requested'
  },
  completionPhoto: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
