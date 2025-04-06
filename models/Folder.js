import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  experiments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experiment'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальное поле для количества экспериментов
folderSchema.virtual('experimentsCount').get(function() {
  return this.experiments.length;
});

export default mongoose.model('Folder', folderSchema);