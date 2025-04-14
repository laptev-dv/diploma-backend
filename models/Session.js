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
}, { 
  _id: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для суммы responseTime в presentations
taskResultSchema.virtual('resultTotalTime').get(function() {
  if (!this.presentations) return 0;
  return this.presentations.reduce((total, presentation) => {
    return total + (presentation.responseTime || 0);
  }, 0);
});

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
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для суммы всех resultTotalTime в results
sessionSchema.virtual('totalSeriesTime').get(function() {
  if (!this.results) return 0;
  return this.results.reduce((total, taskResult) => {
    // Используем get() если это поддокумент, или обращаемся напрямую если виртуальное поле
    const taskTime = taskResult.get ? taskResult.get('resultTotalTime') : taskResult.resultTotalTime;
    return total + (taskTime || 0);
  }, 0);
});

sessionSchema.index({ experiment: 1 });
sessionSchema.index({ user: 1 });
sessionSchema.index({ createdAt: -1 });

export default mongoose.model('Session', sessionSchema);