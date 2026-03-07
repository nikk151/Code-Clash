
function validatePassword(password) {
    if (password.length < 8 || password.length > 20) return "Password must be at least 8 characters and at most 20 characters"
    if (!/[A-Z]/.test(password)) return "Must include an uppercase letter"
    if (!/[a-z]/.test(password)) return "Must include a lowercase letter"
    if (!/[0-9]/.test(password)) return "Must include a number"
    if (!/[!@#$%^&*]/.test(password)) return "Must include a special character (!@#$%^&*)"
    return null  // null = valid
}


module.exports = { validatePassword }
