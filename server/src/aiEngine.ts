import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Added 'usdPrice' as a new parameter
// export const generateLocalizedPitch = async (productName: string, localPrice: string, usdPrice: number, country: string) => {
//     try {
//         const prompt = `
//             You are a global marketing expert. 
//             A company is selling "${productName}" for a localized fair price of ${localPrice} in ${country}.
//             This is equivalent to $${usdPrice} USD.

//             TASK:
//             1. Identify the primary language spoken in ${country}.
//             2. Write a punchy well detailed sales pitch in that NATIVE language using the local price "${localPrice}".
//             3. Then, provide the English translation below it. 
//             4. In the English translation, use the USD value "$${usdPrice}" instead of the local currency so the seller understands the value.

//             FORMAT:
//             [Native Pitch]
//             ---
//             Translation: [English Version using $ symbols]
//         `;

//         const response = await openai.chat.completions.create({
//             model: "gpt-4o-mini", 
//             messages: [{ role: "user", content: prompt }],
//         });

//         return response.choices[0].message.content || "Special local pricing available!";

//     } catch (error) {
//         return `Get it now for just ${localPrice}!`;
//     }
// };

export const generateLocalizedPitch = async (productName: string, localPrice: string, usdPrice: number, country: string) => {
    try {
        const prompt = `
            You are a world-class global marketing expert. 
            Product: "${productName}"
            Localized Price: ${localPrice} (Approx $${usdPrice} USD)
            Target Country: ${country}

            TASK:
            1. Determine the primary language used for E-commerce in ${country}.
            2. Write a punchy well detailed high-converting sales pitch for this product.
            3. Ensure the local price "${localPrice}" is included in the pitch.
            
            FORMATTING RULES:
            [Native Pitch]
             
            - If the primary language is NOT English (like Brazil or India), provide the Native Pitch, a divider line "---", 
              and then an English Translation using the USD value "$${usdPrice}".

            DO NOT output anything other than the pitch.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7, // Adds a bit of creativity while staying professional
        });

        return response.choices[0].message.content || "Get it now for a fair local price!";

    } catch (error) {
        return `Special local pricing available! Get it for just ${localPrice} today!`;
    }
};