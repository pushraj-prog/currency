
import { GoogleGenAI } from "@google/genai";
import { RateDataResponse, ExchangeRates, GroundingSource } from "../types";

export const fetchCurrentRates = async (): Promise<RateDataResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Find and provide the CURRENT mid-market exchange rates for the following pairs:
    - USD to EUR
    - USD to JPY
    - USD to INR
    - EUR to JPY
    
    CRITICAL: At the end of your response, provide the data in this EXACT format for parsing:
    RAW_DATA_START
    USD_EUR: [value]
    USD_JPY: [value]
    USD_INR: [value]
    EUR_JPY: [value]
    RAW_DATA_END
    
    Current date: ${new Date().toLocaleDateString()}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    console.log("Gemini Response Text:", text);

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Market Source",
        uri: chunk.web?.uri || "#"
      }));

    /**
     * Enhanced extraction logic
     */
    const extractFromRaw = (key: string, defaultVal: number): number => {
      // Try to find the specific tag first
      const rawBlockMatch = text.match(/RAW_DATA_START([\s\S]*?)RAW_DATA_END/);
      const searchTarget = rawBlockMatch ? rawBlockMatch[1] : text;

      const patterns = [
        new RegExp(`${key}\\s*[:=]\\s*(\\d+\\.?\\d*)`, 'i'),
        new RegExp(`${key.replace('_', ' to ')}\\s*[:=]?\\s*(\\d+\\.?\\d*)`, 'i'),
        new RegExp(`${key.replace('_', '/')}\\s*[:=]?\\s*(\\d+\\.?\\d*)`, 'i'),
        new RegExp(`1\\s*${key.split('_')[0]}\\s*=\\s*(\\d+\\.?\\d*)`, 'i')
      ];

      for (const pattern of patterns) {
        const match = searchTarget.match(pattern);
        if (match && match[1]) {
          const val = parseFloat(match[1]);
          if (!isNaN(val) && val > 0) return val;
        }
      }
      
      console.warn(`Extraction failed for ${key}, using default: ${defaultVal}`);
      return defaultVal;
    };

    const rates: ExchangeRates = {
      USD_EUR: extractFromRaw('USD_EUR', 0.92),
      USD_JPY: extractFromRaw('USD_JPY', 150.5),
      USD_INR: extractFromRaw('USD_INR', 83.3),
      EUR_JPY: extractFromRaw('EUR_JPY', 163.2),
      lastUpdated: new Date().toISOString(),
    };

    return {
      rates,
      summary: text.split('RAW_DATA_START')[0].trim(),
      sources
    };
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
