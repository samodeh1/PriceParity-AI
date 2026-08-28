import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateLocalizedPitch = async (productName: string, localPrice: string, country: string) => {
    try {
        const prompt = `
            You are a global marketing expert. 
            A company is selling "${productName}" for ${localPrice} in ${country}.
            
            TASK:
            1. Identify the primary language spoken in ${country}.
            2. Write a punchy well detail sales pitch in that NATIVE language.
            3. Use a culturally relevant emoji.
            4. Give a space between the native language and the English translation below it so it's can be easy to read.
            5. Do not mention USD.

            FORMAT:
            [Native Pitch]
            ---
            Translation: [English Version]
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
