import mongoose from 'mongoose';

const ResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Токен истекает через 1 час
  },
});

export default mongoose.model('ResetToken', ResetTokenSchema);