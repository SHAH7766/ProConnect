import Complaint from "../Model/Complaint.js";
export const DeleteAllComplaints = async (req, res) => {
    try {
        await Complaint.deleteMany();
        res.status(200).json({ message: 'All complaints deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting complaints', error });
    }
}
export const CustomerService = async (req, res) => {
    const { message, TypeOfComplaint } = req.body
    const customerId = req.user.id
    console.log(customerId)
    try {
        await Complaint.create({ message, TypeOfComplaint, customerId })
        return res.status(200).send({ Message: "Complaint submitted successfully", success: true })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
export const GetAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('customerId', 'name email')
        return res.status(200).send(complaints)
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
export const UpdateComplaintStatus = async (req, res) => {
    const { id } = req.params
    try {
        await Complaint.findByIdAndUpdate(id, req.body)
        return res.status(200).send({ Message: "Complaint status updated successfully", success: true })
    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}