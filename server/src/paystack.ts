import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Standardizing how we get the secret key
const getSecretKey = () => process.env.PAYSTACK_SECRET_KEY || "";

export const initializePaystackSubscription = async (email: string, planCode: string, userId: string) => {
    // Pro Tip: This log will show up in your Render Logs so you can see if planCode is missing
    console.log(`Paystack Init: Email=${email}, Plan=${planCode}, User=${userId}`);

    const res = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
            email,
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
                Authorization: `Bearer ${getSecretKey()}`,
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