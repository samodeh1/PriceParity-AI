import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateLocalizedPitch = async (productName: string, localPrice: string, country: string) => {
    try {
        const prompt = `
            Write a punchy 2-sentence sales pitch for "${productName}".
            The price for customers in ${country} is exactly ${localPrice}.
            1. Mention the price "${localPrice}" exactly as written.
            2. Use a culturally relevant emoji for ${country}.
            3. Do not mention USD.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", 
            messages: [{ role: "user", content: prompt }],
        });

        return response.choices[0].message.content;
    } catch (error) {
        return `Get it now for just ${localPrice}!`;
    }
};