import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: String,
  rows: { type: Number, min: 1 },
  columns: { type: Number, min: 1 },
  backgroundColor: String,
  symbolColor: String,
  symbolType: String,
  symbolFont: String,
  symbolHeight: { type: Number, min: 1 },
  symbolWidth: { type: Number, min: 1 },
  verticalSpacing: { type: Number, min: 0 },
  horizontalSpacing: { type: Number, min: 0 },
  stimulusTime: { type: Number, min: 1 },
  responseTime: { type: Number, min: 1 },
  pauseTime: { type: Number, min: 1 }
}, { _id: true });

const experimentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['strict', 'adaptive'], required: true },
  efficiencyMin: { 
    type: Number, 
    min: 0, 
    max: 100,
    validate: {
      validator: function(value) {
        return this.mode === 'adaptive' || value === null;
      },
      message: 'efficiencyMin can only be set in adaptive mode'
    }
  },
  efficiencyMax: {
    type: Number,
    min: 0,
    max: 100,
    validate: {
      validator: function(value) {
        if (this.mode === 'adaptive') {
          return value >= this.efficiencyMin;
        }
        return value === null;
      },
      message: 'efficiencyMax must be >= efficiencyMin in adaptive mode'
    }
  },
  initialTaskNumber: {
    type: Number,
    min: 1,
    validate: {
      validator: function(value) {
        return this.mode === 'adaptive' || value === null;
      },
      message: 'initialTaskNumber can only be set in adaptive mode'
    }
  },
  seriesTime: {
    type: Number,
    min: 1,
    validate: {
      validator: function(value) {
        return this.mode === 'adaptive' || value === null;
      },
      message: 'seriesTime can only be set in adaptive mode'
    }
  },
  presentationsPerTask: { type: Number, min: 1, required: true },
  tasks: [taskSchema],
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Experiment', experimentSchema);