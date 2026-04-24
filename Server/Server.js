import express from 'express'
import colors from 'colors'
import dotenv from 'dotenv'
import router from "./Routes/routes.js"
import { Dbconnection } from "./Config/Database.js"
import cors from 'cors'

// 1. Config dotenv first
dotenv.config()

// 2. Connect to Database
Dbconnection()

const app = express()

// 3. Middlewares
app.use(express.json())

// Fixed the nested app.use(cors) syntax error here:
app.use(cors({
  ['https://pro-connect-v6i2.vercel.app', 'https://pro-connect-v6i2.vercel.app/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))

// 4. Routes
app.use("/api", router)

// 5. Listen
const PORT = process.env.PORT || 8080 // Default to 8080 if PORT is missing in .env
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`.bgBrightBlue)
})