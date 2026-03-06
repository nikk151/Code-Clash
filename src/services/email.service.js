const nodemailer = require('nodemailer')
const OtpModel = require('../models/otp.model.js')



const transporter = nodemailer.createTransport({
    service: "gmail",
    auth : {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})


async function sendOTP(email){

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await OtpModel.create({
        email,
        otp
    })

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for CodeClash",
        text: `Your OTP is ${otp}`
    })
}

async function verifyOTP(email, otp){
    const record = await OtpModel.findOne({email, otp})

    if (!record) return false

    await OtpModel.deleteOne({email, otp})

    return true

}

module.exports = {sendOTP, verifyOTP}