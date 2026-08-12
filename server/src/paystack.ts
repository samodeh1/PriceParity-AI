import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Standardizing how we get the secret key
const getSecretKey = () => process.env.PAYSTACK_SECRET_KEY || "";

// server/src/paystack.ts

export const initializePaystackSubscription = async (email: string, planCode: string, userId: string) => {
    // 1. Determine the amount in Kobo based on the plan
    // This ensures the amount sent always matches the plan rules
    const amount = planCode === process.env.PAYSTACK_ANNUAL_PLAN 
        ? 16000000  // ₦160,000 for Annual
        : 1950000;  // ₦19,500 for Monthly

    const res = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
            email,
            amount: amount, // ADDED BACK: Must be an integer in kobo
            plan: planCode, 
            callback_url: `${process.env.CLIENT_URL}/?paystack_success=true`,
            metadata: {
                custom_fields: [
                    {
                        display_name: "User ID",
                        variable_name: "user_id",
                        value: userId
                    }
                ]
            }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
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