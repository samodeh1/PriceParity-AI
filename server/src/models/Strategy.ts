import mongoose from 'mongoose';

const StrategySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productName: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    suggestedPrice: { type: Number, required: true },
    country: { type: String, required: true },
    pitch: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Strategy', StrategySchema);