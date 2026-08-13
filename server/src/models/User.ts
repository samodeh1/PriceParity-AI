import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    isPro: { type: Boolean, default: false }, // Crucial for monetization
    subscriptionId: { type: String }, 
    customerCode: { type: String },
    proExpiry: { type: Date }, 
    lastPaymentReference: { type: String },
    createdAt: { type: Date, default: Date.now } 
});

export default mongoose.model('User', UserSchema);


