import mongoose from 'mongoose';

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
  tasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  }],
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Experiment', experimentSchema);