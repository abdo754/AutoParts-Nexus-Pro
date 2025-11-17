import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

/**
 * Encapsulates interactions with the Gemini API.
 */
export const askGemini = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set. Please ensure it's configured in your environment.");
    return "API key not configured. Please ensure it's set up correctly.";
  }

  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a helpful and friendly assistant for an online auto parts marketplace called "AutoParts Nexus Pro".
        You can assist retailers, suppliers, and administrators.
        Provide concise, relevant information or suggestions based on the user's query.
        If asked about products, you can mention categories like Brakes, Engine, Suspension, Exterior, Drivetrain, Electrical, Cooling, Chassis, Lighting, Fuel System.
        If asked about platform functionality, you can mention features like searching parts, adding to cart, checkout, managing products, viewing sales, or managing users/transactions.`,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 200,
        thinkingConfig: { thinkingBudget: 50 } // Reserve tokens for thinking for flash model
      },
    });

    return response.text;
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      return "An API issue occurred. Please try again or ensure your API key is valid.";
    }
    return 'Failed to get a response from the assistant. Please try again later.';
  }
};