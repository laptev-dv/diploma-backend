import mongoose from 'mongoose';

const presentationResultSchema = new mongoose.Schema({
  responseTime: Number,
  correctAnswer: { row: Number, column: Number },
  userAnswer: { row: Number, column: Number },
  outcome: { type: String, enum: ['success', 'error', 'miss'] }
});

const taskResultSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment.tasks' },
  taskName: String,
  presentations: [presentationResultSchema]
});

const sessionSchema = new mongoose.Schema({
  experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  date: { type: Date, default: Date.now },
  duration: { type: Number, min: 0 },
  results: [taskResultSchema]
});

export default mongoose.model('Session', sessionSchema);