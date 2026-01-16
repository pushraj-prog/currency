
import { GoogleGenAI } from "@google/genai";
import { RateDataResponse, ExchangeRates, GroundingSource } from "../types";

export const fetchCurrentRates = async (): Promise<RateDataResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Explicitly requesting the direct rates in a clear format
  const prompt = `
    Provide the current exchange rates for the following pairs:
    - Direct USD to EUR
    - Direct USD to JPY
    - Direct USD to INR
    - Direct EUR to JPY
    
    Please return them in a clear list format like "USD to EUR: [value]".
    Also provide a 2-sentence market summary regarding these specific currency pairs.
    
    Current date: ${new Date().toLocaleDateString()}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: GroundingSource[] = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Market Source",
        uri: chunk.web?.uri || "#"
      }));

    /**
     * Enhanced extraction logic that tries multiple common patterns
     * to find the rate for a pair of currencies.
     */
    const extractRate = (from: string, to: string, defaultVal: number): number => {
      const patterns = [
        // Pattern: "USD to EUR: 0.92" or "USD to EUR is 0.92"
        `${from} to ${to}[:\\s\\w]+(\\d+\\.?\\d*)`,
        // Pattern: "USD/EUR: 0.92"
        `${from}/${to}[:\\s]+(\\d+\\.?\\d*)`,
        // Pattern: "1 USD = 0.92 EUR"
        `1\\s*${from}\\s*=\\s*(\\d+\\.?\\d*)\\s*${to}`,
        // Pattern: "USD: 0.92 EUR"
        `${from}\\s*[:=]\\s*(\\d+\\.?\\d*)\\s*${to}`
      ];
      
      for (const p of patterns) {
        const regex = new RegExp(p, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          const val = parseFloat(match[1]);
          if (!isNaN(val)) return val;
        }
      }
      
      console.warn(`Could not extract rate for ${from} to ${to}, using default: ${defaultVal}`);
      return defaultVal;
    };

    const rates: ExchangeRates = {
      USD_EUR: extractRate('USD', 'EUR', 0.92),
      USD_JPY: extractRate('USD', 'JPY', 150.5),
      USD_INR: extractRate('USD', 'INR', 83.3),
      EUR_JPY: extractRate('EUR', 'JPY', 163.2),
      lastUpdated: new Date().toISOString(),
    };

    return {
      rates,
      summary: text,
      sources
    };
  } catch (error) {
    console.error("Error fetching rates from Gemini:", error);
    throw error;
  }
};
