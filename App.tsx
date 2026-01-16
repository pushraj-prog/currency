
import React, { useState, useEffect, useCallback } from 'react';
import CurrencyConverter from './components/CurrencyConverter';
import { fetchCurrentRates } from './services/geminiService';
import { ExchangeRates, GroundingSource } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<{
    rates: ExchangeRates;
    summary: string;
    sources: GroundingSource[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentRates();
      setData(result);
    } catch (err) {
      setError("Failed to fetch current exchange rates. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold tracking-wide uppercase shadow-sm">
            Powered by Gemini AI
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Global FX Converter
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real-time multi-currency conversion for USD, EUR, JPY, and INR with accurate market data fetched through AI search grounding.
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={loadRates} className="text-red-700 font-bold underline ml-auto">Retry</button>
          </div>
        )}

        {/* Main Section */}
        {data && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <CurrencyConverter 
              rates={data.rates} 
              onRefresh={loadRates} 
              isLoading={isLoading} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Market Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="bg-blue-600 w-1.5 h-6 rounded-full mr-3"></span>
                  Market Insights
                </h3>
                <div className="prose prose-sm text-slate-600">
                  <p className="whitespace-pre-wrap">{data.summary.replace(/```json[\s\S]*?```/g, '').trim()}</p>
                </div>
              </div>

              {/* Verified Sources */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="bg-blue-600 w-1.5 h-6 rounded-full mr-3"></span>
                  Grounding Sources
                </h3>
                <ul className="space-y-3">
                  {data.sources.length > 0 ? data.sources.map((source, idx) => (
                    <li key={idx}>
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                      >
                        <div className="bg-white p-2 rounded-lg border border-slate-200 group-hover:border-blue-300">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-slate-700 truncate">{source.title}</p>
                          <p className="text-xs text-slate-400 truncate">{source.uri}</p>
                        </div>
                      </a>
                    </li>
                  )) : (
                    <li className="text-slate-400 text-sm italic">No specific sources cited for this refresh.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Skeleton Loader */}
        {isLoading && !data && (
          <div className="space-y-8 animate-pulse">
            <div className="bg-gray-200 h-80 rounded-3xl w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-48 rounded-2xl"></div>
              <div className="bg-gray-200 h-48 rounded-2xl"></div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-slate-200 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Global FX Hub. Rates provided by Google Search Grounding.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
