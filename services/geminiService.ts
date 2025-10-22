import { GoogleGenAI, Modality } from "@google/genai";

export const generateFutureImage = async (base64Image: string, mimeType: string, year: string): Promise<string> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set. Please add it to your Vercel deployment settings.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `Your task is to generate a new photorealistic portrait that shows what the person in the original photo might look like in the year ${year}. It is crucial that the aging process is realistic and progressive. For the year ${year}, introduce appropriate signs of aging such as fine lines, deeper wrinkles around the eyes and mouth, subtle changes in skin elasticity, and some graying of the hair. The signs of aging should be more pronounced than they would be for an earlier year and less pronounced than for a later year. Keep the person's core facial structure and identity intact. The background should be neutral (like a plain studio backdrop) and their clothing should be simple and professional (like a suit), to keep the focus on the person's face. The final output must be a high-quality, realistic photograph.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
            const newBase64Image = firstPart.inlineData.data;
            return `data:image/png;base64,${newBase64Image}`;
        } else {
            throw new Error("No image data received from Gemini API. The response may have been blocked due to safety policies.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
};