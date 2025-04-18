import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Пожалуйста, введите корректный email'
        ]
    },
    passwordHash: {
        type: String,
        required: true,
    },
    invalidatedTokens: [{
        type: Date,
        default: []
    }]
}, {
    timestamps: true,
});

export default mongoose.model('User', UserSchema);