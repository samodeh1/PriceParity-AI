import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_URL = "https://api.paystack.co/transaction/initialize";
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializePaystackSubscription = async (email: string, planCode: string, userId: string) => {
    const res = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
            email,
            plan: planCode, // Paystack uses this to start a subscription automatically
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

// Function to verify payment
export const verifyPaystackPayment = async (reference: string) => {
    const res = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
            headers: { Authorization: `Bearer ${SECRET_KEY}` }
        }
    );
    return res.data.data;
};