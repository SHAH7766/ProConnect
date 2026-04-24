import express from 'express'
import colors from 'colors'
import dotenv from 'dotenv'
import router from "./Routes/routes.js"
import {Dbconnection} from "./Config/Database.js"
import cors from 'cors'
dotenv.config()
const app = express()
app.use(express.json())
app.use(cors(app.use(cors({
  origin: 'https://pro-connect-v6i2.vercel.app/', // Replace with your actual Vercel URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));))
app.use("/api",router)
app.listen(process.env.PORT,()=>{
    console.log(`Server is running at port ${process.env.PORT}`.bgBrightBlue)
})
Dbconnection()
