
import React, { useState, useEffect, useCallback } from 'react';
import CurrencyConverter from './components/CurrencyConverter';
import HistoricalChart from './components/HistoricalChart';
import { fetchCurrentRates } from './services/geminiService';
import { RateDataResponse, ExchangeRates, HistoricalPoint, CurrencyCode } from './types';

// Fixing declaration conflict: Use the globally available AIStudio type and matching modifiers.
declare global {
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  // Use RateDataResponse type directly to include sources for search grounding
  const [data, setData] = useState<RateDataResponse | null>(null);
  
  const [selection, setSelection] = useState<{from: CurrencyCode, to: CurrencyCode}>({
    from: 'USD',
    to: 'INR'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(true);

  const checkKey = useCallback(async () => {
    // If process.env.API_KEY is already set (e.g. via Vercel env vars), we're good.
    // Otherwise, check if the user has selected one via AI Studio.
    const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY !== "";
    if (hasEnvKey) {
      setIsKeyConfigured(true);
      return true;
    }

    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setIsKeyConfigured(selected);
      return selected;
    } catch {
      setIsKeyConfigured(false);
      return false;
    }
  }, []);

  const loadRates = useCallback(async () => {
    const ready = await checkKey();
    if (!ready) return;

    setIsLoading(true);
    try {
      const result = await fetchCurrentRates();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found")) {
        setError("API key session expired or invalid. Please re-select your key.");
        setIsKeyConfigured(false);
      } else {
        setError(msg || "Failed to fetch market data. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [checkKey]);

  useEffect(() => {
    const init = async () => {
      const ready = await checkKey();
      if (ready) {
        loadRates();
      }
    };
    init();
    
    const intervalId = setInterval(() => {
      if (isKeyConfigured) loadRates();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [loadRates, isKeyConfigured, checkKey]);

  const handleCurrencyChange = useCallback((from: CurrencyCode, to: CurrencyCode) => {
    setSelection({ from, to });
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success and proceed per platform guidelines (handle race condition)
      setIsKeyConfigured(true);
      setError(null);
      setTimeout(loadRates, 500); 
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

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

        {!isKeyConfigured ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200 text-center space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Connection Required</h2>
            <p className="text-slate-600">
              To provide real-time market grounding, this app requires a valid Gemini API Key from a paid project.
            </p>
            <div className="space-y-4">
              <button 
                onClick={handleOpenKeySelector}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-95"
              >
                Connect API Key
              </button>
              <p className="text-xs text-slate-400">
                Don't have a key? Visit the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">billing documentation</a>.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex flex-col space-y-2 animate-in slide-in-from-top duration-300 shadow-sm">
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 font-semibold">Service Notice</p>
                  <button onClick={loadRates} className="text-red-700 text-xs font-bold underline ml-auto bg-red-100 px-2 py-1 rounded hover:bg-red-200 transition-colors">Retry Now</button>
                </div>
                <p className="text-xs text-red-600 pl-8">{error}</p>
              </div>
            )}

            {/* Main Section */}
            {data ? (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
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

                {/* Market Summary and Grounding Sources */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <span className="bg-indigo-600 w-1.5 h-6 rounded-full mr-3"></span>
                    Live Market Analysis
                  </h3>
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed mb-6">
                    <p className="whitespace-pre-wrap">{data.summary}</p>
                  </div>

                  {/* Mandated listing of Search Grounding sources */}
                  {data.sources && data.sources.length > 0 && (
                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sources & References</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs bg-slate-50 hover:bg-slate-100 text-blue-600 px-3 py-1.5 rounded-full border border-slate-200 transition-colors flex items-center space-x-1"
                          >
                            <span>{source.title}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-3xl h-96 shadow-sm border border-slate-100 p-8 flex flex-col space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-12 bg-slate-100 rounded w-full"></div>
                    <div className="h-12 bg-slate-100 rounded w-full mt-auto"></div>
                  </div>
                  <div className="bg-white rounded-3xl h-96 shadow-sm border border-slate-100 p-8">
                    <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
                    <div className="h-full bg-slate-50 rounded w-full"></div>
                  </div>
                </div>
                <div className="bg-white rounded-3xl h-48 shadow-sm border border-slate-100 p-8 text-center flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-500 font-medium">Fetching real-time data...</p>
                </div>
              </div>
            )}
          </>
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
