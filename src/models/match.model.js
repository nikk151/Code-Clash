const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // The Players involved
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String, // Denormalized for speed
      socketId: String, // To send private messages/updates
      isWinner: { type: Boolean, default: false },
      
      // Real-time tracking
      code: { type: String, default: "" }, // Their last submitted code
      status: { 
        type: String, 
        enum: ['idle', 'coding', 'submitted', 'disqualified'],
        default: 'idle'
      }
    }
  ],
  
  problemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Problem',
    required: true 
  },
  
  // Match State
  status: { 
    type: String, 
    enum: ['waiting', 'in-progress', 'completed', 'aborted'],
    default: 'waiting'
  },
  
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);