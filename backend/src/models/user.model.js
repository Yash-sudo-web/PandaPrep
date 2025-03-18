import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    displayName: { type: String, required: true },
    photoURL: { type: String },
    providerId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now },
    providerData: {
        providerId: { type: String },
        uid: { type: String },
        displayName: { type: String },
        email: { type: String },
        photoURL: { type: String }
    },
    tokens: {
        accessToken: { type: String },
        refreshToken: { type: String },
        expirationTime: { type: Number }
    }
});

export const UserModel= mongoose.model("User", userSchema);
