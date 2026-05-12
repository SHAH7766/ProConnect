import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'provider', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
