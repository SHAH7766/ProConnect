import Booking from "../Model/Booking.js";
import Provider from "../Model/Provider.js";
import Message from "../Model/Message.js";
import User from "../Model/User.js";
import Review from "../Model/Review.js";
import { sendBookingNotification } from "../utils/BookingNotification.js";
import { uploadImageBuffer } from "../utils/Cloudinary.js";
import { activeProviderFilter, isProviderActive } from "../utils/ProviderActivation.js";

const DEFAULT_NEW_PROVIDER_RATING = 3.2;
const DEFAULT_NEW_PROVIDER_COMPLETION_RATE = 70;
const DEFAULT_BASE_CHARGES = 1000;
const TRAVEL_RATE_PER_KM = 40;

const toNumberOrNull = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
    const lat1 = toNumberOrNull(fromLat);
    const lon1 = toNumberOrNull(fromLng);
    const lat2 = toNumberOrNull(toLat);
    const lon2 = toNumberOrNull(toLng);

    if ([lat1, lon1, lat2, lon2].some((value) => value === null)) return null;

    const toRadians = (degrees) => degrees * Math.PI / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number((earthRadiusKm * c).toFixed(1));
};

const getProviderBookingStats = async (providerId) => {
    const bookings = await Booking.find({ providerId }).select('status');
    const completed = bookings.filter((booking) => booking.status === 'Completed').length;
    const decided = bookings.filter((booking) => ['Completed', 'Cancelled', 'Disputed'].includes(booking.status)).length;

    return {
        jobsCompleted: completed,
        completionRate: decided > 0 ? Math.round((completed / decided) * 100) : DEFAULT_NEW_PROVIDER_COMPLETION_RATE
    };
};

const calculateLocationAdjustedCharges = (baseCharges, distance) => {
    const parsedBase = Number(baseCharges || 0);
    const base = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : DEFAULT_BASE_CHARGES;
    if (distance === null || distance === undefined) return Math.round(base);

    const travelFee = Math.ceil(Number(distance) * TRAVEL_RATE_PER_KM);
    return Math.round(base + travelFee);
};

const isPastDate = (value) => {
    const selectedDate = new Date(value);
    if (Number.isNaN(selectedDate.getTime())) return true;

    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selectedDate < today;
};

const buildProviderStats = async (provider, customerLocation = {}) => {
    const category = provider.category || 'Plumber';
    const { jobsCompleted, completionRate } = await getProviderBookingStats(provider._id);
    const distance = calculateDistanceKm(
        customerLocation.latitude,
        customerLocation.longitude,
        provider.location?.latitude,
        provider.location?.longitude
    );
    const baseCharges = Number(provider.charges || 0) > 0 ? provider.charges : DEFAULT_BASE_CHARGES;
    const calculatedCharges = calculateLocationAdjustedCharges(baseCharges, distance);
    const travelFee = Math.max(calculatedCharges - baseCharges, 0);
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
        rating: Number((provider.ratingAverage || DEFAULT_NEW_PROVIDER_RATING).toFixed(1)),
        ratingCount: provider.ratingCount || 0,
        baseCharges,
        travelFee,
        charges: calculatedCharges,
        distance,
        completionRate,
        jobsCompleted,
        location: provider.location || {},
        skills,
        summary: `${provider.name} is a verified ${category.toLowerCase()} with ${provider.experience} years of experience, Rs. ${calculatedCharges} estimated charges, and ${completionRate}% completion rate.`,
    };
};

export const SearchProviders = async (req, res) => {
    try {
        const { category, maxCharges, maxDistance, minCompletionRate, latitude, longitude } = req.query;
        const providers = await Provider.find(activeProviderFilter()).select('-password');
        let result = await Promise.all(providers.map((item) => buildProviderStats(item, { latitude, longitude })));

        if (category) {
            result = result.filter((item) => item.category.toLowerCase() === category.toLowerCase());
        }
        if (maxCharges) {
            result = result.filter((item) => item.charges <= Number(maxCharges));
        }
        if (maxDistance) {
            result = result.filter((item) => item.distance !== null && item.distance <= Number(maxDistance));
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
        if (!provider || !isProviderActive(provider)) {
            return res.status(404).send({ Message: "Provider not found", success: false });
        }

        const providerStats = await buildProviderStats(provider, {
            latitude: req.query.latitude,
            longitude: req.query.longitude
        });

        return res.status(200).send({ provider: providerStats, success: true });
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
        const latitude = Number(address?.latitude);
        const longitude = Number(address?.longitude);

        if (!providerId || !serviceCategory || !scheduledDate) {
            return res.status(400).send({ Message: "Provider, category, and date are required", success: false });
        }
        if (isPastDate(scheduledDate)) {
            return res.status(400).send({ Message: "Please select today or a future date", success: false });
        }
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return res.status(400).send({ Message: "Please share your Google Maps location for this service request", success: false });
        }

        let problemPhoto = '';
        if (req.file) {
            const uploadedImage = await uploadImageBuffer(req.file.buffer);
            problemPhoto = uploadedImage.secure_url;
        } else if (req.body.problemPhoto) {
            problemPhoto = req.body.problemPhoto;
        }

        const selectedProvider = await Provider.findById(providerId).select('email name charges isActive');
        if (!selectedProvider || !isProviderActive(selectedProvider)) {
            return res.status(400).send({ Message: "This provider account is not active yet", success: false });
        }
        const requestedCharges = Number(charges);
        const baseCharges = Number(selectedProvider.charges || 0) > 0 ? selectedProvider.charges : DEFAULT_BASE_CHARGES;
        const finalCharges = Number.isFinite(requestedCharges) && requestedCharges >= baseCharges
            ? Math.round(requestedCharges)
            : baseCharges;

        const booking = await Booking.create({
            customerId: req.user.id,
            providerId,
            serviceCategory,
            description,
            scheduledDate,
            address: {
                ...address,
                latitude,
                longitude,
                mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
            },
            charges: finalCharges,
            problemPhoto,
        });

        const [, customer] = await Promise.all([
            Promise.resolve(selectedProvider),
            User.findById(req.user.id).select('name email')
        ]);

        if (selectedProvider?.email) {
            sendBookingNotification(selectedProvider.email, {
                customerName: customer?.name || req.user.name || "Customer",
                serviceCategory,
                scheduledDate: new Date(scheduledDate).toLocaleDateString(),
                charges: finalCharges,
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

        const bookingIds = bookings.map((booking) => booking._id);
        const reviews = await Review.find({ bookingId: { $in: bookingIds } }).select('bookingId');
        const reviewedBookingIds = new Set(reviews.map((review) => review.bookingId.toString()));
        const result = bookings.map((booking) => ({
            ...booking.toObject(),
            hasReview: reviewedBookingIds.has(booking._id.toString())
        }));

        return res.status(200).send(result);
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

export const ReviewBooking = async (req, res) => {
    try {
        const { rating, comment = '' } = req.body;
        const numericRating = Number(rating);

        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).send({ Message: "Rating must be between 1 and 5", success: false });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        if (booking.customerId.toString() !== req.user.id) {
            return res.status(403).send({ Message: "You can review only your own booking", success: false });
        }

        if (booking.status !== 'Completed') {
            return res.status(400).send({ Message: "You can review after the booking is completed", success: false });
        }

        const existingReview = await Review.findOne({ bookingId: booking._id });
        if (existingReview) {
            return res.status(409).send({ Message: "You already reviewed this booking", success: false });
        }

        const review = await Review.create({
            bookingId: booking._id,
            providerId: booking.providerId,
            customerId: req.user.id,
            rating: numericRating,
            comment: comment.trim()
        });

        const stats = await Review.aggregate([
            { $match: { providerId: booking.providerId } },
            { $group: { _id: '$providerId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        await Provider.findByIdAndUpdate(booking.providerId, {
            ratingAverage: stats[0] ? Number(stats[0].average.toFixed(1)) : 0,
            ratingCount: stats[0]?.count || 0
        });

        return res.status(201).send({ Message: "Review submitted successfully", review, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};
