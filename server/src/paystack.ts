import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Standardizing how we get the secret key
const getSecretKey = () => process.env.PAYSTACK_SECRET_KEY || "";

// server/src/paystack.ts

export const initializePaystackSubscription = async (email: string, planCode: string, userId: string) => {
    // Pro Debugging: This will show in Render logs to ensure planCode isn't empty
    console.log(`Initializing Plan: ${planCode} for User: ${userId}`);

    const res = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
            email,
            // 1. We DELETED the 'amount' line. 
            // Paystack will automatically charge whatever price you set on the dashboard for this Plan ID.
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