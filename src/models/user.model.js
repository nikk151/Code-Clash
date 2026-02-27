const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    index: true // Index for fast "Search Friend" queries
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true,
    select: false // Never return password by default
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Game Stats
  eloRating: { 
    type: Number, 
    default: 1200, // Standard starting rating
    index: true // CRITICAL: We need to sort users by rating fast for matchmaking
  },
  totalMatches: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },

  // Optional: For your GitHub-style profile
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);