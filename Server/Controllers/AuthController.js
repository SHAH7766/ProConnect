import user from "../Model/User.js"
import provider from "../Model/Provider.js"
import { HashPassword, ComparePassword } from "../Auth/Hash.js"
import { EmailClient } from "../utils/Nodemailer.js"
import { LoginEmail } from "../utils/LoginEmail.js"
import Complaint from "../Model/Complaint.js"
import jwt from 'jsonwebtoken'
import { resetpassword } from "../utils/ResetPassword.js"
export const RegisterUser = async (req, res) => {
    let role = ""
    try {
        const { name, email, password, experience } = req.body
        const existUser = await user.findOne({ email })
        let countusers = await user.find()
        if (countusers.length > 0)
            role = "user"
        else
            role = "admin"
        if (existUser)
            return res.status(409).send({ Message: "User already exists", success: false })
        let hashPassword = await HashPassword(password)
        let newuser = await user.create({ name, email, password: hashPassword, role: role, experience })
        newuser = await newuser.save()
        if (newuser) {
            await EmailClient(email, name)
            return res.send({ Message: "Registered successfully", success: true })
        }
        else
            return res.send({ Message: "Failed to register", success: false })
    } catch (error) {
        console.log(error)
    }
}

export const LoginController = async (req, res) => {
    try {
        const { email, password } = req.body
        const existUser = await user.findOne({ email })
        if (!existUser)
            return res.send({ Message: "Account not found", success: false })
        const resultPassword = await ComparePassword(password, existUser.password)
        if (!resultPassword)
            return res.send({ Message: "Invalid Credinatials", success: false })
        let LoggedUser = {
            id: existUser._id,
            name: existUser.name,
            email: existUser.email,
            role: existUser.role
        }
        if (resultPassword) {
            await LoginEmail(email)
            const token = jwt.sign({ LoggedUser }, process.env.SECRET_KEY, { expiresIn: "5min" })
            return res.send({ Message: `Welcome back ${existUser.name}`, success: true, token, role: existUser.role })
        }
    } catch (error) {
        console.log(error)
    }
}


//  Provider Controllers

export const RegisterProvider = async (req, res) => {
    let role = ""
    try {
        const { name, email, password, experience } = req.body
        const existProvider = await provider.findOne({ email })
        let countProviders = await provider.find()
        if (existProvider)
            return res.send({ Message: "Provider already exists", success: false })
        let hashPassword = await HashPassword(password)
        let newProvider = await provider.create({ name, email, password: hashPassword, role: 'provider', experience })
        newProvider = await newProvider.save()
        if (newProvider) {
            await EmailClient(email, name)
            return res.send({ Message: "Registered successfully", success: true })
        }
        else
            return res.send({ Message: "Failed to register", success: false })
    } catch (error) {
        return res.send({ Message: "Error occurred", success: false })
    }

}
export const loginProvider = async (req, res) => {
    try {
        const { email, password } = req.body
        const existProvider = await provider.findOne({ email })
        if (!existProvider)
            return res.send({ Message: "Account not found", success: false })
        const resultPassword = await ComparePassword(password, existProvider.password)
        if (!resultPassword)
            return res.send({ Message: "Invalid Credinatials", success: false })
        let LoggedProvider = {
            id: existProvider._id,
            name: existProvider.name,
            email: existProvider.email,
            role: existProvider.role
        }
        if (resultPassword) {
            await LoginEmail(email)
            const token = jwt.sign({ LoggedProvider }, process.env.SECRET_KEY, { expiresIn: "20m" })
            return res.send({ Message: `Welcome back ${existProvider.name}`, success: true, token, role: LoggedProvider.role })
        }

    } catch (error) {
        console.log(error)
    }
}
export const GetAll = async (req, res) => {
    try {
        const providers = await provider.find()
        const users = await user.find()
        const result = [...providers, ...users]
        return res.send(result)
        // if (providers.length > 0)
        //     return res.send(providers)
    } catch (error) {
        console.log(error)
    }
}
export const DeleteUser = async (req, res) => {
    try {
        console.log("Delete Request Received for ID:", req.params.id); // DEBUG
        await provider.findByIdAndDelete(req.params.id)
        await user.findByIdAndDelete(req.params.id)
        return res.send({ Message: "User deleted successfully", success: true })
    } catch (error) {
        console.log(error)
    }
}

export const Profile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).send({ Message: "User not found in request", success: false });
        }

        const { id, role } = req.user;
        let profileData = null;

        if (role === 'provider') {
            profileData = await provider.findById(id).select('-password');
        } else {
            profileData = await user.findById(id).select('-password');
        }

        if (!profileData) {
            return res.status(404).send({ Message: "Profile not found", success: false });
        }

        return res.send({ profile: profileData, success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ Message: "Internal server error", success: false });
    }
}
export const GetAllProviders = async (req, res) => {
    try {
        const allproviders = await provider.find()
        if (allproviders.length > 0)
            return res.status(200).send(allproviders)
        else
            return res.status(404).send({ Message: "No providers found", success: false })
    } catch (error) {

        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
export const ForgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const existUser = await user.findOne({ email })
        const existProvider = await provider.findOne({ email })
        if (!existUser)
            return res.status(404).send({ Message: "Account not found", success: false })
        if (!existProvider)
            return res.status(404).send({ Message: "Account not found", success: false })
        const resetToken = await jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "15m" })
        const resetLink = `http://localhost:5173/resetpassword?token=${resetToken}`
        await resetpassword(email, resetLink)
        return res.send({ Message: "Password reset link sent to your email", success: true })

    } catch (error) {
        console.log(error)
        return res.status(500).send({ Message: "Internal server error", success: false })
    }
}
export const ResetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Log the body to see exactly what is arriving from the frontend
        console.log("Request Body:", req.body);

        if (!token || !password) {
            return res.status(400).json({ success: false, Message: "Missing token or password" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const email = decoded.email;
        const hashedPassword = await HashPassword(password);

        // Update the password in both collections for your ProConnect app
        const updatedUser = await user.findOneAndUpdate({ email }, { password: hashedPassword });
        const updatedProvider = await provider.findOneAndUpdate({ email }, { password: hashedPassword });

        if (!updatedUser && !updatedProvider) {
            return res.status(404).json({ success: false, Message: "Account not found" });
        }

        return res.status(200).json({ success: true, Message: "Password updated successfully!" });

    } catch (error) {
        console.error("ResetPassword Error:", error); // Check your terminal for this!
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, Message: "Link expired" });
        }
        return res.status(500).json({ success: false, Message: "Internal server error" });
    }
};
