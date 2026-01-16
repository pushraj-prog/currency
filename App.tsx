import React, { useState, useEffect, useCallback } from 'react';
import CurrencyConverter from './components/CurrencyConverter';
import HistoricalChart from './components/HistoricalChart';
import { fetchCurrentRates } from './services/geminiService';
import { ExchangeRates, HistoricalPoint, CurrencyCode } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<{
    rates: ExchangeRates;
    historical: HistoricalPoint[];
    summary: string;
  } | null>(null);
  
  const [selection, setSelection] = useState<{from: CurrencyCode, to: CurrencyCode}>({
    from: 'USD',
    to: 'INR'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentRates();
      setData(result);
    } catch (err) {
      setError("Failed to fetch market data. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    const intervalId = setInterval(loadRates, 60000);
    return () => clearInterval(intervalId);
  }, [loadRates]);

  const handleCurrencyChange = useCallback((from: CurrencyCode, to: CurrencyCode) => {
    setSelection({ from, to });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold tracking-wide uppercase shadow-sm">
            Powered by Gemini AI
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Global FX Converter
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real-time multi-currency conversion with AI-driven historical market trends.
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-center space-x-3">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={loadRates} className="text-red-700 font-bold underline ml-auto">Retry</button>
          </div>
        )}

        {/* Main Section */}
        {data && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <CurrencyConverter 
                rates={data.rates} 
                onRefresh={loadRates} 
                isLoading={isLoading} 
                onCurrencyChange={handleCurrencyChange}
              />
              
              <HistoricalChart 
                data={data.historical} 
                fromCurrency={selection.from} 
                toCurrency={selection.to} 
              />
            </div>

            {/* Market Summary */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <span className="bg-indigo-600 w-1.5 h-6 rounded-full mr-3"></span>
                Live Market Analysis
              </h3>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                <p className="whitespace-pre-wrap">{data.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Skeleton Loader */}
        {isLoading && !data && (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-3xl"></div>
              <div className="bg-gray-200 h-96 rounded-3xl"></div>
            </div>
            <div className="bg-gray-200 h-48 rounded-3xl"></div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-slate-200 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Global FX Hub. Grounded by Gemini Search.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;