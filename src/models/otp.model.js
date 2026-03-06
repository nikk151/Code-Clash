const mongoose = require("mongoose")

// otp.model.js — MongoDB auto-deletes after 10 minutes!
const otpSchema = new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: { type: Date, default: Date.now, expires: 600 }  // 600 seconds = 10 min
})

module.exports = mongoose.model("Otp", otpSchema)
