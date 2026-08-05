import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_URL = "https://api.paystack.co/transaction/initialize";
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializePaystackPayment = async (email: string, amount: number, userId: string) => {
    const res = await axios.post(
        PAYSTACK_URL,
        {
            email,
            amount: amount * 100 * 1362.27, // $10 * 100 (cents) * 1362.27 (Current Naira Rate)
            // Note: If you have a USD Paystack account, remove the 1362.27 multiplier.
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
                Authorization: `Bearer ${SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return res.data.data; // This contains the 'authorization_url' and 'reference'
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