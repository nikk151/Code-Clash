require('dotenv').config();

const express = require('express')
const matchRoutes = require('./routes/match.routes.js')
const authRoutes = require('./routes/auth.routes.js')
const problemRoutes = require('./routes/problems.routes.js')
const cookieParser = require('cookie-parser');


const app = express()
app.use(express.json())
app.use(cookieParser());


app.use("/api/auth", authRoutes)
app.use("/api/problems", problemRoutes)
app.use("/api/match", matchRoutes)




module.exports = app