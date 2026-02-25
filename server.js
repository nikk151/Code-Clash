const app = require('./src/app')
require('dotenv').config()
const connectDB = require('./src/db/db.js')

connectDB()



app.listen(3000, ()=>{
    console.log('server is running on port 3000')
})