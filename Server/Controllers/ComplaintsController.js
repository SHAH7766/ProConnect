import Complaint from "../Model/Complaint.js";
import Booking from "../Model/Booking.js";

const isAdmin = (req) => req.user?.role === 'admin';
const canUseComplaintForm = (req) => ['user', 'admin'].includes(req.user?.role);

export const DeleteAllComplaints = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).send({ Message: "Only admins can delete complaints", success: false });
        }

        await Complaint.deleteMany();
        res.status(200).json({ message: 'All complaints deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting complaints', error });
    }
}
export const CustomerService = async (req, res) => {
    const { message, TypeOfComplaint, providerId, bookingId } = req.body
    const customerId = req.user.id
    try {
        if (!canUseComplaintForm(req)) {
            return res.status(403).send({ Message: "Only customers and admins can submit complaints", success: false });
        }

        if (!providerId) {
            return res.status(400).send({ Message: "Please select the provider this complaint is against", success: false })
        }

        if (bookingId) {
            const booking = await Booking.findById(bookingId)
            if (!booking || booking.customerId.toString() !== customerId || booking.providerId.toString() !== providerId) {
                return res.status(403).send({ Message: "You can complain only against your own booking provider", success: false })
            }
        }

        await Complaint.create({ message, TypeOfComplaint, customerId, providerId, bookingId })
        return res.status(200).send({ Message: "Complaint submitted successfully", success: true })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
export const GetAllComplaints = async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).send({ Message: "Only admins can view all complaints", success: false });
        }

        const complaints = await Complaint.find()
            .populate('customerId', 'name email')
            .populate('providerId', 'name email category')
            .populate('bookingId', 'serviceCategory status scheduledDate')
        return res.status(200).send(complaints)
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
export const UpdateComplaintStatus = async (req, res) => {
    const { id } = req.params
    try {
        if (!isAdmin(req)) {
            return res.status(403).send({ Message: "Only admins can update complaint status", success: false });
        }

        await Complaint.findByIdAndUpdate(id, req.body)
        return res.status(200).send({ Message: "Complaint status updated successfully", success: true })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
