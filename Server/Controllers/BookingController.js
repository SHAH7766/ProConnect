import Booking from "../Model/Booking.js";
import Provider from "../Model/Provider.js";
import Message from "../Model/Message.js";
import User from "../Model/User.js";
import { sendBookingNotification } from "../utils/BookingNotification.js";
import { uploadImageBuffer } from "../utils/Cloudinary.js";

const buildProviderStats = (provider) => {
    const seed = provider._id.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const category = provider.category || 'Plumber';
    const rating = Number((4 + (seed % 10) / 10).toFixed(1));
    const charges = 1200 + (seed % 8) * 350;
    const distance = Number((1 + (seed % 25) / 2).toFixed(1));
    const completionRate = 82 + (seed % 17);
    const jobsCompleted = 40 + (seed % 360);
    const skills = category === 'Plumber'
        ? ['Leak repair', 'Pipe fitting', 'Drain cleaning']
        : ['Wiring', 'Fault repair', 'Switch boards'];

    return {
        _id: provider._id,
        name: provider.name,
        email: provider.email,
        role: provider.role,
        experience: provider.experience,
        category,
        rating,
        charges,
        distance,
        completionRate,
        jobsCompleted,
        skills,
        summary: `${provider.name} is a verified ${category.toLowerCase()} with ${provider.experience} years of experience and a ${completionRate}% completion rate.`,
    };
};

export const SearchProviders = async (req, res) => {
    try {
        const { category, maxCharges, maxDistance, minCompletionRate } = req.query;
        const providers = await Provider.find().select('-password');
        let result = providers.map(buildProviderStats);

        if (category) {
            result = result.filter((item) => item.category.toLowerCase() === category.toLowerCase());
        }
        if (maxCharges) {
            result = result.filter((item) => item.charges <= Number(maxCharges));
        }
        if (maxDistance) {
            result = result.filter((item) => item.distance <= Number(maxDistance));
        }
        if (minCompletionRate) {
            result = result.filter((item) => item.completionRate >= Number(minCompletionRate));
        }

        return res.status(200).send(result);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const GetProviderDetails = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id).select('-password');
        if (!provider) {
            return res.status(404).send({ Message: "Provider not found", success: false });
        }

        return res.status(200).send({ provider: buildProviderStats(provider), success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const CreateBooking = async (req, res) => {
    try {
        const { providerId, serviceCategory, description, scheduledDate, charges } = req.body;
        const address = typeof req.body.address === 'string'
            ? JSON.parse(req.body.address || '{}')
            : req.body.address;

        if (!providerId || !serviceCategory || !scheduledDate) {
            return res.status(400).send({ Message: "Provider, category, and date are required", success: false });
        }

        let problemPhoto = '';
        if (req.file) {
            const uploadedImage = await uploadImageBuffer(req.file.buffer);
            problemPhoto = uploadedImage.secure_url;
        } else if (req.body.problemPhoto) {
            problemPhoto = req.body.problemPhoto;
        }

        const booking = await Booking.create({
            customerId: req.user.id,
            providerId,
            serviceCategory,
            description,
            scheduledDate,
            address,
            charges,
            problemPhoto,
        });

        const [selectedProvider, customer] = await Promise.all([
            Provider.findById(providerId).select('email name'),
            User.findById(req.user.id).select('name email')
        ]);

        if (selectedProvider?.email) {
            sendBookingNotification(selectedProvider.email, {
                customerName: customer?.name || req.user.name || "Customer",
                serviceCategory,
                scheduledDate: new Date(scheduledDate).toLocaleDateString(),
                charges,
                description
            });
        }

        return res.status(201).send({ Message: "Service request sent successfully", booking, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const GetMyBookings = async (req, res) => {
    try {
        const filter = req.user.role === 'provider'
            ? { providerId: req.user.id }
            : { customerId: req.user.id };

        const bookings = await Booking.find(filter)
            .populate('providerId', 'name email experience')
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).send(bookings);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const UpdateBookingStatus = async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        const isProviderOwner = req.user.role === 'provider' && booking.providerId.toString() === req.user.id;
        const isCustomerOwner = booking.customerId.toString() === req.user.id;

        if (!isProviderOwner && !isCustomerOwner && req.user.role !== 'admin') {
            return res.status(403).send({ Message: "Not allowed to update this booking", success: false });
        }

        if (status) booking.status = status;
        if (paymentStatus) booking.paymentStatus = paymentStatus;
        await booking.save();

        return res.status(200).send({ Message: "Booking updated successfully", booking, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const DeleteBookingRequest = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking request not found", success: false });
        }

        const isCustomerOwner = booking.customerId.toString() === req.user.id;
        if (!isCustomerOwner && req.user.role !== 'admin') {
            return res.status(403).send({ Message: "You can delete only your own booking request", success: false });
        }

        if (booking.status !== 'Requested' && req.user.role !== 'admin') {
            return res.status(400).send({ Message: "Accepted bookings cannot be deleted. Please contact the provider or cancel the service.", success: false });
        }

        await Message.deleteMany({ bookingId: booking._id });
        await Booking.findByIdAndDelete(booking._id);

        return res.status(200).send({ Message: "Booking request deleted successfully", success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

const canUseBookingChat = (booking, user) => {
    const isCustomer = booking.customerId.toString() === user.id;
    const isProvider = booking.providerId.toString() === user.id;
    return (isCustomer || isProvider || user.role === 'admin') && ['Accepted', 'In-Progress', 'Completed'].includes(booking.status);
};

export const GetBookingMessages = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        if (!canUseBookingChat(booking, req.user)) {
            return res.status(403).send({ Message: "Chat is available after provider accepts the booking", success: false });
        }

        const messages = await Message.find({ bookingId: booking._id }).sort({ createdAt: 1 });
        return res.status(200).send(messages);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const SendBookingMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        if (!canUseBookingChat(booking, req.user)) {
            return res.status(403).send({ Message: "Chat is available after provider accepts the booking", success: false });
        }

        if (!message || !message.trim()) {
            return res.status(400).send({ Message: "Message is required", success: false });
        }

        const createdMessage = await Message.create({
            bookingId: booking._id,
            senderId: req.user.id,
            senderRole: req.user.role,
            message: message.trim()
        });

        return res.status(201).send({ Message: "Message sent", chatMessage: createdMessage, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};
