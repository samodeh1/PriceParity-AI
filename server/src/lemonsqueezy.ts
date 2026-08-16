import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const LEMON_SQUEEZY_URL = "https://api.lemonsqueezy.com/v1/checkouts";
// Ensure you have added LEMON_SQUEEZY_API_KEY to your Render Environment Variables
const API_KEY = process.env.LEMON_SQUEEZY_API_KEY;

/**
 * Helper to get authorization headers
 */
const getHeaders = () => ({
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${API_KEY}`
});

/**
 * Create a Lemon Squeezy Checkout
 * @param storeId - Your Store ID from Lemon Squeezy Settings
 * @param variantId - The ID of the product/plan (Monthly or Annual)
 * @param email - User's email
 * @param userId - MongoDB User ID to track fulfillment
 */
export const createLemonSqueezyCheckout = async (storeId: string, variantId: string, email: string, userId: string) => {
    try {
        const response = await axios.post(
            LEMON_SQUEEZY_URL,
            {
                data: {
                    type: "checkouts",
                    attributes: {
                        checkout_data: {
                            email: email,
                            // Pass User ID in custom data so the Webhook can find it
                            custom: {
                                user_id: userId
                            }
                        }
                    },
                    relationships: {
                        store: {
                            data: { type: "stores", id: storeId }
                        },
                        variant: {
                            data: { type: "variants", id: variantId }
                        }
                    }
                }
            },
            { headers: getHeaders() }
        );

        // Lemon Squeezy returns a checkout URL in attributes.url
        return response.data.data.attributes.url;
    } catch (error: any) {
        console.error("Lemon Squeezy Init Error:", error.response?.data || error.message);
        throw new Error("Could not initialize Lemon Squeezy payment");
    }
};

/**
 * Retrieve a checkout to verify status 
 * (Note: Professional SaaS usually use Webhooks for this instead of GET requests)
 */
export const verifyLemonSqueezyCheckout = async (checkoutId: string) => {
    try {
        const res = await axios.get(
            `${LEMON_SQUEEZY_URL}/${checkoutId}`,
            { headers: getHeaders() }
        );
        return res.data.data;
    } catch (error: any) {
        console.error("Lemon Squeezy Verify Error:", error.message);
        throw new Error("Verification failed");
    }
};