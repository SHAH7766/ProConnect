import Booking from "../Model/Booking.js";
import Provider from "../Model/Provider.js";
import Message from "../Model/Message.js";
import User from "../Model/User.js";
import Review from "../Model/Review.js";
import mongoose from "mongoose";
import { sendBookingNotification } from "../utils/BookingNotification.js";
import { uploadAudioBuffer, uploadImageBuffer } from "../utils/Cloudinary.js";
import { activeProviderFilter, isProviderActive } from "../utils/ProviderActivation.js";
import Safepay from "@sfpy/node-core";

const DEFAULT_NEW_PROVIDER_RATING = 3.2;
const DEFAULT_NEW_PROVIDER_COMPLETION_RATE = 70;
const DEFAULT_BASE_CHARGES = 1000;
const TRAVEL_RATE_PER_KM = 40;
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox';
const SAFEPAY_HOST = SAFEPAY_ENV === 'production'
    ? 'https://api.getsafepay.com'
    : 'https://sandbox.api.getsafepay.com';

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

const getProviderBookingStats = async (providerId, defaultCompletionRate = DEFAULT_NEW_PROVIDER_COMPLETION_RATE) => {
    const bookings = await Booking.find({ providerId }).select('status');
    const completed = bookings.filter((booking) => booking.status === 'Completed').length;
    const decided = bookings.filter((booking) => ['Completed', 'Cancelled', 'Disputed'].includes(booking.status)).length;

    return {
        jobsCompleted: completed,
        completionRate: decided > 0 ? Math.round((completed / decided) * 100) : defaultCompletionRate
    };
};

const calculateLocationAdjustedCharges = (baseCharges, distance) => {
    const parsedBase = Number(baseCharges || 0);
    const base = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : DEFAULT_BASE_CHARGES;
    if (distance === null || distance === undefined) return Math.round(base);

    const travelFee = Math.ceil(Number(distance) * TRAVEL_RATE_PER_KM);
    return Math.round(base + travelFee);
};

const buildProviderReviewSummary = async (providerId) => {
    const reviews = await Review.find({ providerId })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('rating comment customerId createdAt');

    if (reviews.length === 0) {
        return {
            reviewSummary: 'No customer reviews yet.',
            recentReviews: []
        };
    }

    const comments = reviews
        .map((review) => review.comment?.trim())
        .filter(Boolean);
    const average = reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length;
    const reviewSummary = comments.length > 0
        ? `Recent customers rated this provider ${average.toFixed(1)}/5 and mentioned: ${comments.slice(0, 2).join(' ')}`
        : `Recent customers rated this provider ${average.toFixed(1)}/5.`;

    return {
        reviewSummary,
        recentReviews: reviews.map((review) => ({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            customerName: review.customerId?.name || 'Customer',
            createdAt: review.createdAt
        }))
    };
};

const getSafepayClient = () => {
    if (!process.env.SAFEPAY_SECRET_KEY || !process.env.SAFEPAY_API_KEY) {
        throw new Error("Safepay keys are not configured");
    }

    return new Safepay(process.env.SAFEPAY_SECRET_KEY, {
        authType: 'secret',
        host: SAFEPAY_HOST
    });
};

const getSafepayTrackerToken = (response) => response?.data?.tracker?.token || response?.tracker?.token || response?.data?.token;
const getSafepayPassportToken = (response) => response?.data?.token || response?.data || response?.token;
const getSafepayTrackerState = (response) => response?.data?.state || response?.state;

const normalizeCategory = (category = '') => {
    return category === 'Electrician' ? 'Electronics' : category;
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
    const category = normalizeCategory(provider.category || 'Plumber');
    const defaultCompletionRate = Number.isFinite(Number(provider.completionRate))
        ? Number(provider.completionRate)
        : DEFAULT_NEW_PROVIDER_COMPLETION_RATE;
    const { jobsCompleted, completionRate } = await getProviderBookingStats(provider._id, defaultCompletionRate);
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
        : ['Electronics repair', 'Fault diagnosis', 'Appliance service'];
    const { reviewSummary, recentReviews } = await buildProviderReviewSummary(provider._id);

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
        reviewSummary,
        recentReviews,
    };
};

export const SearchProviders = async (req, res) => {
    try {
        const { category, maxCharges, maxDistance, minCompletionRate, latitude, longitude } = req.query;
        const providers = await Provider.find(activeProviderFilter()).select('-password');
        let result = await Promise.all(providers.map((item) => buildProviderStats(item, { latitude, longitude })));

        if (category) {
            const requestedCategory = normalizeCategory(category).toLowerCase();
            result = result.filter((item) => item.category.toLowerCase() === requestedCategory);
        }
        if (maxCharges) {
            result = result.filter((item) => item.charges <= Number(maxCharges));
        }
        if (maxDistance) {
            result = result.filter((item) => item.distance !== null && item.distance <= Number(maxDistance));
        }
        if (minCompletionRate) {
            result = result.filter((item) => item.completionRate !== null && item.completionRate >= Number(minCompletionRate));
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
        const filter = req.user.role === 'admin'
            ? {}
            : req.user.role === 'provider'
                ? { providerId: req.user.id }
                : { customerId: req.user.id };

        const bookings = await Booking.find(filter)
            .populate('providerId', 'name email phone experience')
            .populate('customerId', 'name email phone')
            .sort({ createdAt: -1 });

        const bookingIds = bookings.map((booking) => booking._id);
        const reviews = await Review.find({ bookingId: { $in: bookingIds } }).select('bookingId');
        const reviewedBookingIds = new Set(reviews.map((review) => review.bookingId.toString()));
        const result = bookings.map((booking) => {
            const bookingObject = booking.toObject();
            if (req.user.role !== 'admin' && bookingObject.paymentRelease?.providerAccountNumber) {
                bookingObject.paymentRelease = {
                    ...bookingObject.paymentRelease,
                    providerAccountNumber: undefined
                };
            }

            return {
                ...bookingObject,
                hasReview: reviewedBookingIds.has(booking._id.toString())
            };
        });

        return res.status(200).send(result);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const GetLatestIncomingChatMessages = async (req, res) => {
    try {
        const filter = req.user.role === 'provider'
            ? { providerId: req.user.id }
            : { customerId: req.user.id };

        const bookings = await Booking.find({
            ...filter,
            status: { $in: ['Accepted', 'In-Progress', 'Completed'] },
            paymentStatus: { $in: ['Paid', 'Released'] }
        })
            .populate('providerId', 'name')
            .populate('customerId', 'name')
            .select('serviceCategory providerId customerId status');

        const latestMessages = await Promise.all(bookings.map(async (booking) => {
            const latestMessage = await Message.findOne({
                bookingId: booking._id,
                senderId: { $ne: req.user.id }
            }).sort({ createdAt: -1 });

            if (!latestMessage) return null;

            const otherParty = req.user.role === 'provider'
                ? booking.customerId?.name || 'Customer'
                : booking.providerId?.name || 'Provider';

            return {
                bookingId: booking._id,
                serviceCategory: booking.serviceCategory,
                otherParty,
                message: latestMessage.message || 'Voice message',
                audioUrl: latestMessage.audioUrl || '',
                createdAt: latestMessage.createdAt
            };
        }));

        return res.status(200).send(latestMessages.filter(Boolean));
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

        if (status && ['In-Progress', 'Completed'].includes(status) && !['Paid', 'Released'].includes(booking.paymentStatus)) {
            return res.status(400).send({ Message: "Payment must be completed before work can start or complete", success: false });
        }

        if (status === 'Completed') {
            return res.status(400).send({ Message: "Please submit completion proof photo to complete the work", success: false });
        }

        if (status && ['Accepted', 'In-Progress'].includes(status) && !isProviderOwner && req.user.role !== 'admin') {
            return res.status(403).send({ Message: "Only the assigned provider can update work status", success: false });
        }

        if (status) booking.status = status;
        if (paymentStatus) {
            if (paymentStatus === 'Released') {
                const providerAccountNumber = String(req.body.providerAccountNumber || '').trim();

                if (req.user.role !== 'admin') {
                    return res.status(403).send({ Message: "Only admin can release payment after reviewing completed work", success: false });
                }
                if (booking.status !== 'Completed') {
                    return res.status(400).send({ Message: "Payment can be released after the work is completed", success: false });
                }
                if (booking.paymentStatus !== 'Paid') {
                    return res.status(400).send({ Message: "Only held payments can be released", success: false });
                }
                if (!booking.completionPhoto) {
                    return res.status(400).send({ Message: "Completion proof photo is required before releasing payment", success: false });
                }
                if (!providerAccountNumber) {
                    return res.status(400).send({ Message: "Provider account number is required before releasing payment", success: false });
                }
                if (!/^[A-Za-z0-9 -]{6,34}$/.test(providerAccountNumber)) {
                    return res.status(400).send({ Message: "Provider account number must be 6 to 34 letters or numbers", success: false });
                }

                booking.paymentRelease = {
                    providerAccountNumber,
                    releasedAt: new Date(),
                    releasedBy: req.user.id
                };
            } else {
                if (!isCustomerOwner && req.user.role !== 'admin') {
                    return res.status(403).send({ Message: "Only the customer can update payment status", success: false });
                }
                if (paymentStatus === 'Paid' && req.user.role !== 'admin') {
                    return res.status(400).send({ Message: "Please complete payment through Safepay", success: false });
                }
                if (paymentStatus === 'Paid' && booking.status !== 'Accepted') {
                    return res.status(400).send({ Message: "Payment is available after provider accepts the booking", success: false });
                }
            }
            booking.paymentStatus = paymentStatus;
        }
        await booking.save();

        return res.status(200).send({ Message: "Booking updated successfully", booking, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

export const CompleteBookingWithProof = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        const isProviderOwner = req.user.role === 'provider' && booking.providerId.toString() === req.user.id;
        if (!isProviderOwner) {
            return res.status(403).send({ Message: "Only the assigned provider can submit completion proof", success: false });
        }

        if (booking.status !== 'In-Progress') {
            return res.status(400).send({ Message: "Work can be completed only after it is in progress", success: false });
        }

        if (!['Paid', 'Released'].includes(booking.paymentStatus)) {
            return res.status(400).send({ Message: "Payment must be completed before submitting completed work", success: false });
        }

        if (!req.file) {
            return res.status(400).send({ Message: "Please upload a completion proof photo", success: false });
        }

        const uploadedImage = await uploadImageBuffer(req.file.buffer, 'proconnect/completion-proof');
        booking.completionPhoto = uploadedImage.secure_url;
        booking.status = 'Completed';
        await booking.save();

        return res.status(200).send({ Message: "Completion proof submitted for admin review", booking, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: error.message || "Unable to submit completion proof", success: false });
    }
};

export const CreateSafepayCheckout = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customerId', 'name email')
            .populate('providerId', 'name');

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        if (booking.customerId?._id?.toString() !== req.user.id) {
            return res.status(403).send({ Message: "Only the customer can pay for this booking", success: false });
        }

        if (booking.status !== 'Accepted') {
            return res.status(400).send({ Message: "Payment is available after provider accepts the booking", success: false });
        }

        if (booking.paymentStatus === 'Paid') {
            return res.status(400).send({ Message: "This booking is already paid", success: false });
        }

        const safepay = getSafepayClient();
        const amount = Math.round(Number(booking.charges || 0) * 100);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).send({ Message: "Booking charges are missing", success: false });
        }

        const session = await safepay.payments.session.setup({
            merchant_api_key: process.env.SAFEPAY_API_KEY,
            intent: 'CYBERSOURCE',
            mode: 'payment',
            entry_mode: 'raw',
            currency: 'PKR',
            amount,
            metadata: {
                order_id: booking._id.toString(),
                source: 'proconnect'
            }
        });
        const tracker = getSafepayTrackerToken(session);

        if (!tracker) {
            return res.status(502).send({ Message: "Safepay did not return a tracker", success: false });
        }

        const passport = await safepay.client.passport.create();
        const tbt = getSafepayPassportToken(passport);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const checkoutUrl = safepay.checkout.createCheckoutUrl({
            env: SAFEPAY_ENV,
            tracker,
            tbt,
            source: 'hosted',
            order_id: booking._id.toString(),
            redirect_url: `${clientUrl}/payment-success`,
            cancel_url: `${clientUrl}/payment-cancel`
        });

        booking.safepay = { tracker, state: 'TRACKER_CREATED' };
        await booking.save();

        return res.status(200).send({ checkoutUrl, tracker, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: error.message || "Unable to start Safepay checkout", success: false });
    }
};

export const ConfirmSafepayPayment = async (req, res) => {
    try {
        const { tracker } = req.query;
        if (!tracker) {
            return res.status(400).send({ Message: "Safepay tracker is required", success: false });
        }

        const booking = await Booking.findOne({ 'safepay.tracker': tracker });
        if (!booking) {
            return res.status(404).send({ Message: "Booking not found for this payment", success: false });
        }

        if (booking.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).send({ Message: "Not allowed to confirm this payment", success: false });
        }

        const safepay = getSafepayClient();
        const response = await safepay.reporter.payments.fetch(tracker);
        const state = getSafepayTrackerState(response);

        booking.safepay = {
            ...booking.safepay,
            tracker,
            state
        };

        if (state === 'TRACKER_ENDED') {
            booking.paymentStatus = 'Paid';
            booking.safepay.paidAt = new Date();
        }

        await booking.save();

        return res.status(200).send({
            Message: state === 'TRACKER_ENDED' ? "Payment confirmed. Chat is now available." : "Payment is still processing.",
            booking,
            paymentConfirmed: state === 'TRACKER_ENDED',
            state,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: error.message || "Unable to confirm Safepay payment", success: false });
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

export const DeleteAllBookings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).send({ Message: "Only admin can delete all bookings", success: false });
        }

        const bookings = await Booking.find({}).select('_id');
        const bookingIds = bookings.map((booking) => booking._id);

        if (bookingIds.length === 0) {
            return res.status(200).send({ Message: "No bookings to delete", deletedCount: 0, success: true });
        }

        const removedReviews = await Review.find({ bookingId: { $in: bookingIds } }).select('providerId');
        const affectedProviderIds = [
            ...new Set(removedReviews.map((review) => review.providerId?.toString()).filter(Boolean))
        ];

        await Promise.all([
            Message.deleteMany({ bookingId: { $in: bookingIds } }),
            Review.deleteMany({ bookingId: { $in: bookingIds } }),
            Booking.deleteMany({ _id: { $in: bookingIds } })
        ]);

        await Promise.all(affectedProviderIds.map(async (providerId) => {
            const stats = await Review.aggregate([
                { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
                { $group: { _id: '$providerId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]);

            await Provider.findByIdAndUpdate(providerId, {
                ratingAverage: stats[0] ? Number(stats[0].average.toFixed(1)) : DEFAULT_NEW_PROVIDER_RATING,
                ratingCount: stats[0]?.count || 0
            });
        }));

        return res.status(200).send({
            Message: `Deleted ${bookingIds.length} booking${bookingIds.length === 1 ? '' : 's'} successfully`,
            deletedCount: bookingIds.length,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
};

const canUseBookingChat = (booking, user) => {
    const isCustomer = booking.customerId.toString() === user.id;
    const isProvider = booking.providerId.toString() === user.id;
    return (isCustomer || isProvider || user.role === 'admin')
        && ['Accepted', 'In-Progress', 'Completed'].includes(booking.status)
        && ['Paid', 'Released'].includes(booking.paymentStatus);
};

export const GetBookingMessages = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        if (!canUseBookingChat(booking, req.user)) {
            return res.status(403).send({ Message: "Chat is available after the provider accepts the booking and payment is completed", success: false });
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
        const { message = '' } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).send({ Message: "Booking not found", success: false });
        }

        if (!canUseBookingChat(booking, req.user)) {
            return res.status(403).send({ Message: "Chat is available after the provider accepts the booking and payment is completed", success: false });
        }

        let audioUrl = '';
        let audioPublicId = '';

        if (req.file) {
            try {
                const uploadedAudio = await uploadAudioBuffer(req.file.buffer);
                audioUrl = uploadedAudio.secure_url;
                audioPublicId = uploadedAudio.public_id;
            } catch (uploadError) {
                console.log("Voice message upload failed:", uploadError.message);
                return res.status(500).send({
                    Message: uploadError.message || "Voice message upload failed",
                    success: false
                });
            }
        }

        if (!message.trim() && !audioUrl) {
            return res.status(400).send({ Message: "Message or voice note is required", success: false });
        }

        const createdMessage = await Message.create({
            bookingId: booking._id,
            senderId: req.user.id,
            senderRole: req.user.role,
            message: message.trim(),
            audioUrl,
            audioPublicId
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
