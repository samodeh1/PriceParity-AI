import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Added 'usdPrice' as a new parameter
export const generateLocalizedPitch = async (productName: string, localPrice: string, usdPrice: number, country: string) => {
    try {
        const prompt = `
            You are a global marketing expert. 
            A company is selling "${productName}" for a localized fair price of ${localPrice} in ${country}.
            This is equivalent to $${usdPrice} USD.

            TASK:
            1. Identify the primary language spoken in ${country}.
            2. Write a punchy well detailed sales pitch in that NATIVE language using the local price "${localPrice}".
            3. Then, provide the English translation below it. 
            4. In the English translation, use the USD value "$${usdPrice}" instead of the local currency so the seller understands the value.

            FORMAT:
            [Native Pitch]
            ---
            Translation: [English Version using $ symbols]
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", 
            messages: [{ role: "user", content: prompt }],
        });

        return response.choices[0].message.content || "Special local pricing available!";

    } catch (error) {
        return `Get it now for just ${localPrice}!`;
    }
};