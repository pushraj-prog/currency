
export type CurrencyCode = 'USD' | 'EUR' | 'JPY' | 'INR';

export interface ExchangeRates {
  USD_EUR: number;
  USD_JPY: number;
  USD_INR: number;
  EUR_JPY: number;
  lastUpdated: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface RateDataResponse {
  rates: ExchangeRates;
  summary: string;
  sources: GroundingSource[];
}
