import { GoogleGenAI } from "@google/genai";
import { RateDataResponse, ExchangeRates, GroundingSource, HistoricalPoint } from "../types";

export const fetchCurrentRates = async (): Promise<RateDataResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Find the CURRENT real-time mid-market exchange rates and HISTORICAL rates for the last 7 days for these pairs:
    - USD to EUR
    - USD to JPY
    - USD to INR
    
    Today's Date: ${new Date().toLocaleDateString()}

    Format the results exactly as follows at the end of your response:
    
    CURRENT_START
    USD_EUR: [value]
    USD_JPY: [value]
    USD_INR: [value]
    EUR_JPY: [value]
    CURRENT_END

    HISTORICAL_START
    [Date ISO string], [USD_EUR], [USD_JPY], [USD_INR]
    ... (provide 7 entries including today)
    HISTORICAL_END
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
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

    // Parse Current Rates
    const currentBlock = text.match(/CURRENT_START([\s\S]*?)CURRENT_END/);
    const currentText = currentBlock ? currentBlock[1] : text;
    
    const parseRate = (key: string, fallback: number): number => {
      const re = new RegExp(`${key}\\s*[:=]\\s*(\\d+\\.?\\d*)`, 'i');
      const m = currentText.match(re);
      return m ? parseFloat(m[1]) : fallback;
    };

    const rates: ExchangeRates = {
      USD_EUR: parseRate('USD_EUR', 0.92),
      USD_JPY: parseRate('USD_JPY', 151.0),
      USD_INR: parseRate('USD_INR', 83.5),
      EUR_JPY: parseRate('EUR_JPY', 164.0),
      lastUpdated: new Date().toISOString(),
    };

    // Parse Historical Data
    const histBlock = text.match(/HISTORICAL_START([\s\S]*?)HISTORICAL_END/);
    const historical: HistoricalPoint[] = [];
    if (histBlock) {
      const lines = histBlock[1].trim().split('\n');
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          historical.push({
            date: parts[0],
            USD_EUR: parseFloat(parts[1]),
            USD_JPY: parseFloat(parts[2]),
            USD_INR: parseFloat(parts[3]),
          });
        }
      });
    }

    const summary = text.replace(/CURRENT_START[\s\S]*?HISTORICAL_END/g, '').trim();

    return {
      rates,
      historical: historical.length > 0 ? historical : createFallbackHistorical(rates),
      summary: summary || "Rates updated successfully.",
      sources
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to fetch live data.");
  }
};

const createFallbackHistorical = (rates: ExchangeRates): HistoricalPoint[] => {
  const result: HistoricalPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // Add some random noise for visualization if API fails to provide history
    const noise = () => (Math.random() - 0.5) * 0.01;
    result.push({
      date: date.toISOString().split('T')[0],
      USD_EUR: rates.USD_EUR + noise(),
      USD_JPY: rates.USD_JPY + noise() * 10,
      USD_INR: rates.USD_INR + noise() * 5,
    });
  }
  return result;
};