/**
 * Centralized configuration — validates all required env vars on startup.
 * If any are missing, the server crashes immediately with a clear message
 * instead of failing silently at runtime.
 */

const requiredVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "JDOODLE_CLIENT_ID",
    "JDOODLE_CLIENT_SECRET"
]

const missing = requiredVars.filter(key => !process.env[key])

if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n   ${missing.join("\n   ")}`)
    console.error(`\n   Add them to your .env file and restart.\n`)
    process.exit(1)
}

module.exports = {
    mongo: {
        uri: process.env.MONGO_URI
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: "7d"
    },
    jdoodle: {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        apiUrl: "https://api.jdoodle.com/v1/execute"
    }
}
