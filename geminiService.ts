
// @ts-ignore - Optional dependency
import { GoogleGenAI } from "@google/genai";

// Get API key from environment variables (Vite uses import.meta.env, but we also check process.env for compatibility)
const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || 
               (import.meta.env as any).GEMINI_API_KEY || 
               (typeof process !== 'undefined' && (process.env as any).GEMINI_API_KEY) || 
               '';

if (!apiKey) {
  console.warn('⚠️ Gemini API key not found. AI features will not work. Please add GEMINI_API_KEY to your .env file.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateCommunication = async (type: 'welcome' | 'reminder' | 'expiry' | 'general', memberName: string, planName: string, expiryDate?: string) => {
  if (!ai) {
    return "AI service is not configured. Please add your Gemini API key to the .env file.";
  }

  const prompt = `Write a professional and friendly ${type} message for a gym member at "Goodlife Fitness". 
  Name: ${memberName}, Plan: ${planName}${expiryDate ? `, Expiry Date: ${expiryDate}` : ''}. 
  Keep it concise and motivating. Use placeholders like [Gym Phone] and [Gym Email].`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    return result.text || "Error: No response from AI";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Error generating message: ${error?.message || 'Unknown error'}. Please check your API key and try again.`;
  }
};

export const generateSummary = async (stats: any) => {
  if (!ai) {
    return "AI service is not configured. Please add your Gemini API key to the .env file to enable AI insights.";
  }

  const prompt = `You are a business analyst for a gym management system. Based on these statistics, provide a brief, professional summary of business health and 3 actionable recommendations for management:

Statistics:
- Active Members: ${stats.active}
- Expiring Soon: ${stats.expiring}
- Expired Memberships: ${stats.expired}
- Total Revenue: ₵${stats.revenue?.toLocaleString() || 0}
- Total Registered: ${stats.total}

Provide insights in a clear, actionable format.`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });
    return result.text || "Error: No response from AI";
  } catch (error: any) {
    console.error("Gemini Summary Error:", error);
    return `Could not generate summary: ${error?.message || 'Unknown error'}. Please check your API key and try again.`;
  }
};
