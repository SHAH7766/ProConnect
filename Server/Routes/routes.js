import express from 'express'
import { GetAll, RegisterUser, LoginController, RegisterProvider, loginProvider, DeleteUser, Profile, GetAllProviders, ForgotPassword, ResetPassword } from "../Controllers/AuthController.js"
import { RegisterValidator, VerifyToken, ResetPasswordValidator } from "../Middleware/validator.js"
import { sendEmailOTP, ResetPasswordByOtp } from '../Controllers/OTPcontroller.js'
const router = express.Router()
router.post("/regprovider", RegisterValidator, RegisterProvider)
router.post("/loginprovider", loginProvider)
router.post("/reguser", RegisterValidator, RegisterUser)
router.post("/loginuser", LoginController)
router.get("/getall", VerifyToken, GetAll)
router.delete("/delete/:id", VerifyToken, DeleteUser)
router.get("/profile", VerifyToken, Profile)
router.get("/getallproviders", GetAllProviders)
router.post("/forgotpassword", ForgotPassword)  //=> link to reset password
router.post("/resetpassword", ResetPasswordValidator, ResetPassword)  //=> reset password using token
router.post("/sendotp", sendEmailOTP)  //=> send OTP to email for verification
router.post("/verifyotp", ResetPasswordByOtp);
export default router;