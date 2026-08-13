import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Safe fallback getter for secret keys
const getSecretKey = () => {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
        console.error("CRITICAL CONFIGURATION ERROR: PAYSTACK_SECRET_KEY is undefined in environment variables!");
    }
    return key || "";
};

export const initializePaystackSubscription = async (email: string, planCode: string, userId: string) => {
    try {
        const res = await axios.post("https://api.paystack.co/transaction/initialize", {
            email,
            plan: planCode,
            callback_url: `${process.env.CLIENT_URL}/?paystack_success=true`,
            metadata: { custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: userId }] }
        }, {
            headers: { Authorization: `Bearer ${getSecretKey()}` }
        });
        return res.data.data;
    } catch (error: any) {
        console.error("Paystack Initialize Subscription Exception:", error?.response?.data || error.message);
        throw new Error(error?.response?.data?.message || "Paystack initialization failed.");
    }
};

export const initializeDynamicPayment = async (email: string, amountInKobo: number, userId: string) => {
    try {
        const res = await axios.post("https://api.paystack.co/transaction/initialize", {
            email,
            amount: amountInKobo,
            callback_url: `${process.env.CLIENT_URL}/?paystack_success=true`,
            metadata: { custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: userId }] }
        }, {
            headers: { Authorization: `Bearer ${getSecretKey()}` }
        });
        return res.data.data;
    } catch (error: any) {
        console.error("Paystack Dynamic Payment Exception:", error?.response?.data || error.message);
        throw new Error(error?.response?.data?.message || "Paystack dynamic checkout failed.");
    }
};

export const verifyPaystackPayment = async (reference: string) => {
    try {
        if (!reference) {
            throw new Error("No transaction reference string was supplied to the verify processor.");
        }
        
        const res = await axios.get(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: { Authorization: `Bearer ${getSecretKey()}` }
            }
        );
        return res.data.data;
    } catch (error: any) {
        // Logs exactly what Paystack says is wrong (e.g., "Invalid Key", "Transaction Not Found")
        console.error("Paystack Verification Engine Crash Trace:", error?.response?.data || error.message);
        throw error;
    }
};
