import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateLocalizedPitch = async (productName: string, price: number, country: string) => {
    try {
        // 1. The Dynamic Prompt (Uses the data from the user)
        const prompt = `
            Write a punchy 2-sentence sales pitch for "${productName}" priced at $${price} in ${country}.
            The price has been adjusted for ${country}'s local purchasing power.
            Mention the fair local price and use an emoji.
        `;

        // 2. The AI Call (Using the Luna model you selected)
        const response = await openai.chat.completions.create({
            model: "gpt-5.6-luna", 
            messages: [{ role: "user", content: prompt }],
        });

        // 3. Return the AI's words
        return response.choices[0].message.content || "Special local pricing available! 🚀";

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return "Special local pricing available! 🚀"; // Fallback message if API fails
    }
};