import mongoose from 'mongoose';

const presentationResultSchema = new mongoose.Schema(
  {
    responseTime: Number,
    correctAnswer: {
      row: { type: Number },
      column: { type: Number },
    },
    userAnswer: {
      row: { type: Number },
      column: { type: Number },
    },
  },
  { _id: false }
);

const taskResultSchema = new mongoose.Schema({
  task: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  presentations: [presentationResultSchema],
}, { _id: true });

const sessionSchema = new mongoose.Schema({
  experiment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Experiment', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  results: [taskResultSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

sessionSchema.index({ experiment: 1 });
sessionSchema.index({ user: 1 });
sessionSchema.index({ createdAt: -1 });

export default mongoose.model('Session', sessionSchema);