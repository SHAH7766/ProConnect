import express from 'express'
const ComplaintsRouter = express.Router()
import { DeleteAllComplaints,CustomerService,GetAllComplaints } from "../Controllers/ComplaintsController.js"
ComplaintsRouter.delete("/deleteall", DeleteAllComplaints)
ComplaintsRouter.post("/customerservice", CustomerService)
ComplaintsRouter.get("/allcomplaints", GetAllComplaints)
export default ComplaintsRouter;