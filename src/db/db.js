require('dotenv').config()
const mongoose = require('mongoose')


async function connectDB() {
    
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log('connected to DB')
    }catch{
        console.log('problem connecting DB')
    }
}


module.exports = connectDB