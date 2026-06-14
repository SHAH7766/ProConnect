import express from 'express'
import colors from 'colors'
import 'dotenv/config'
import router from "./Routes/routes.js"
import { Dbconnection } from "./Config/Database.js"
import cors from 'cors'
import mongoose from 'mongoose'
import ComplaintsRouter from './Routes/ComplaintsRoutes.js'
import BookingRouter from './Routes/BookingRoutes.js'
const app = express()
Dbconnection()
const allowedOrigins = [
    'https://pro-connect-v6i2.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.CLIENT_URL || '').split(',')
].map((origin) => origin.trim()).filter(Boolean)

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(cors(corsOptions))
app.get("/", (req, res) => {
    res.send({ Message: "ProConnect API is running", success: true })
})
app.get("/api/health", (req, res) => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    }

    res.send({
        server: "running",
        database: states[mongoose.connection.readyState] || "unknown",
        success: mongoose.connection.readyState === 1
    })
})
app.use("/api", router)
app.use('/api', ComplaintsRouter) // New route for complaints management
app.use('/api', BookingRouter)
const PORT = process.env.PORT || 8080 // Default to 8080 if PORT is missing in .env
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`.bgBrightBlue)
})
