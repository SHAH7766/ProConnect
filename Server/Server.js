import express from 'express'
import colors from 'colors'
import dotenv from 'dotenv'
import router from "./Routes/routes.js"
import { Dbconnection } from "./Config/Database.js"
import cors from 'cors'
import ComplaintsRouter from './Routes/ComplaintsRoutes.js'
const app = express()
dotenv.config()
Dbconnection()
app.use(express.json())
app.use(cors({
    origin: 'https://pro-connect-v6i2.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors(corsOptions));
app.use("/api", router)
app.use('/api', ComplaintsRouter) // New route for complaints management
const PORT = process.env.PORT || 8080 // Default to 8080 if PORT is missing in .env
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`.bgBrightBlue)
})