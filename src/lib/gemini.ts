import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, GEMINI_MODEL } from "./gemini-config";

export const geminiService = {
    async generateResponse(prompt: string) {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error generating content with Gemini:", error);
            throw error;
        }
    },

    async analyzeImage(prompt: string, imageBase64: string, mimeType: string = "image/jpeg") {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                }
            ]);
            return result.response.text();
        } catch (error) {
            console.error("Error analyzing image:", error);
            throw error;
        }
    },

    // Specific Use Cases

    async startChat(history: { role: "user" | "model"; parts: string }[] = []) {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        return model.startChat({
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.parts }]
            }))
        })
    }
};
