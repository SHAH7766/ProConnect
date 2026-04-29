const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // 1. PARTICIPANTS
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },

  // 2. SERVICE DETAILS
  serviceCategory: { 
    type: String, 
    required: true // e.g., 'Plumbing', 'Electrical'
  },
  description: { 
    type: String ,
  },
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  address: {
    street: String,
    city: String,
    area: String, // Useful for local navigation in cities like Lahore
  },

  // 3. FINANCIALS
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending'
  },

  // 4. WORKFLOW STATUS
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'In-Progress', 'Completed', 'Cancelled', 'Disputed'],
    default: 'Requested'
  },

  // 5. POST-SERVICE
  completionPhoto: { 
    type: String // Proof of work uploaded by provider
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);