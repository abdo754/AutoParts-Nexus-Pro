import { GoogleGenAI, Type } from '@google/genai';

interface TranslationRequestItem {
  id: string;
  text: string;
}

interface TranslationResponseItem {
  id: string;
  translatedText: string;
}

/**
 * Translates a batch of texts using the Gemini API.
 * @param textsToTranslate An array of objects, each with a unique `id` and `text` to be translated.
 * @param targetLanguage The target language for translation ('en' for English, 'ar' for Arabic).
 * @returns A promise that resolves to an array of objects, each containing the original `id` and the `translatedText`.
 */
const translateTexts = async (
  textsToTranslate: TranslationRequestItem[],
  targetLanguage: 'en' | 'ar',
): Promise<TranslationResponseItem[]> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set. Please ensure it's configured in your environment.");
    throw new Error("API key not configured. Please ensure it's set up correctly.");
  }

  if (textsToTranslate.length === 0) {
    return [];
  }

  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `You are a professional translator. Translate all provided text accurately and naturally. Do not add any conversational filler or extra explanations.`;
  const prompt = `Translate the following JSON array of objects from English to ${targetLanguage === 'ar' ? 'Arabic' : 'English'}.
  The input format is an array of objects like: ${JSON.stringify([{ id: "uniqueId1", text: "Hello world" }])}.
  The output must be a JSON array of objects with the same structure, like: ${JSON.stringify([{ id: "uniqueId1", translatedText: "مرحبا بالعالم" }])}.
  Maintain the original 'id' for each translated text in the output.
  Input JSON for translation: ${JSON.stringify(textsToTranslate)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              translatedText: { type: Type.STRING },
            },
            required: ['id', 'translatedText'],
          },
        },
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        thinkingConfig: { thinkingBudget: 50 },
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as TranslationResponseItem[];
  } catch (error: any) {
    console.error('Error calling Gemini API for translation:', error);
    if (error.message && error.message.includes("Requested entity was not found.")) {
      throw new Error("An API issue occurred during translation. Please try again or ensure your API key is valid.");
    }
    throw new Error('Failed to get translation from the assistant. Please try again later.');
  }
};

export default translateTexts;