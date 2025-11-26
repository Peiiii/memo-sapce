import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image to generate a poetic, abstract memory description.
 */
export const interpretMemory = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Observe this image. Describe it as a fleeting, abstract, and nostalgic memory. Write a single, very short, poetic sentence in Chinese (maximum 20 words). Do not describe the literal objects, but the feeling of the memory.",
          },
        ],
      },
    });

    return response.text || "一段模糊的记忆...";
  } catch (error) {
    console.error("Failed to interpret memory:", error);
    return "无法触及的记忆片段...";
  }
};
