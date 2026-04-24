import express from 'express'
import { GetAll, RegisterUser, LoginController, RegisterProvider, loginProvider, DeleteUser, Profile, GetAllProviders } from "../Controllers/AuthController.js"
import { RegisterValidator, VerifyToken } from "../Middleware/validator.js"
const router = express.Router()
router.post("/regprovider", RegisterProvider)
router.post("/loginprovider", loginProvider)
router.post("/reguser", RegisterValidator, RegisterUser)
router.post("/loginuser", LoginController)
router.get("/getall", VerifyToken, GetAll)
router.delete("/delete/:id", VerifyToken, DeleteUser)
router.get("/profile", VerifyToken, Profile)
router.get("/getallproviders",  GetAllProviders)
export default router;