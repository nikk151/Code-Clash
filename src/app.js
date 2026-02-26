require('dotenv').config();

const express = require('express')
const userModel = require('./models/user.model.js')
const authRoutes = require('./routes/auth.routes.js')
const cookieParser = require('cookie-parser');


const app = express()
app.use(express.json())
app.use(cookieParser());


app.use("/auth", authRoutes)




module.exports = app