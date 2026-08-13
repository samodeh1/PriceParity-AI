import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Standardizing how we get the secret key
const getSecretKey = () => process.env.PAYSTACK_SECRET_KEY || "";

// server/src/paystack.ts

export const initializePaystackSubscription = async (email: string, planCode: string, userId: string) => {
    const res = await axios.post("https://api.paystack.co/transaction/initialize", {
        email,
        plan: planCode,
        callback_url: `${process.env.CLIENT_URL}/?paystack_success=true`,
        metadata: { custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: userId }] }
    }, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    return res.data.data;
};

// FUNCTION B: For Localized Fair-Pricing (Nigeria, India, etc.)
export const initializeDynamicPayment = async (email: string, amountInKobo: number, userId: string) => {
    const res = await axios.post("https://api.paystack.co/transaction/initialize", {
        email,
        amount: amountInKobo, // No plan code here, just the fair price!
        callback_url: `${process.env.CLIENT_URL}/?paystack_success=true`,
        metadata: { custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: userId }] }
    }, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    return res.data.data;
};

export const verifyPaystackPayment = async (reference: string) => {
    const res = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
            headers: { Authorization: `Bearer ${getSecretKey()}` }
        }
    );
    return res.data.data;
};