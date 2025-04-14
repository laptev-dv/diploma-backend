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
  stimulusTime: { type: Number, min: 0 },
  responseTime: { type: Number, min: 0 },
  pauseTime: { type: Number, min: 0 },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);