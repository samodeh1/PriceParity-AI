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
            4. Then, provide the English translation below it.
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
// export const generateLocalizedPitch = async (productName: string, localPrice: string, country: string) => {
//     try {
//         const prompt = `
//             Write a punchy 2-sentence sales pitch for "${productName}".
//             The price for customers in ${country} is exactly ${localPrice}.
//             1. Mention the price "${localPrice}" exactly as written.
//             2. Use a culturally relevant emoji for ${country}.
//             3. Do not mention USD.
//         `;

//         const response = await openai.chat.completions.create({
//             model: "gpt-4o-mini", 
//             messages: [{ role: "user", content: prompt }],
//         });

//         return response.choices[0].message.content;
//     } catch (error) {
//         return `Get it now for just ${localPrice}!`;
//     }
// };