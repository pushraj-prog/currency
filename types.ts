export type CurrencyCode = 'USD' | 'EUR' | 'JPY' | 'INR';

export interface ExchangeRates {
  USD_EUR: number;
  USD_JPY: number;
  USD_INR: number;
  EUR_JPY: number;
  lastUpdated: string;
}

export interface HistoricalPoint {
  date: string;
  USD_EUR: number;
  USD_JPY: number;
  USD_INR: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface RateDataResponse {
  rates: ExchangeRates;
  historical: HistoricalPoint[];
  summary: string;
  sources: GroundingSource[];
}