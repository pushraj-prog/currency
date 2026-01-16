
import React, { useState, useEffect, useCallback } from 'react';
import CurrencyConverter from './components/CurrencyConverter';
import HistoricalChart from './components/HistoricalChart';
import { fetchCurrentRates } from './services/geminiService';
import { RateDataResponse, ExchangeRates, HistoricalPoint, CurrencyCode } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<RateDataResponse | null>(null);
  const [selection, setSelection] = useState<{from: CurrencyCode, to: CurrencyCode}>({
    from: 'USD',
    to: 'INR'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyConfigured, setIsKeyConfigured] = useState<boolean>(true);

  // Check if an API key is available via environment or AI Studio session
  const checkKey = useCallback(async () => {
    // Priority 1: Environment Variable (Vercel Build-time / Secret)
    const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY !== "";
    if (hasEnvKey) {
      setIsKeyConfigured(true);
      return true;
    }

    // Priority 2: Session Key (Interactive Selection)
    try {
      // @ts-ignore - aistudio is provided by the environment
      if (window.aistudio) {
        // @ts-ignore - hasSelectedApiKey is provided by the environment
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsKeyConfigured(selected);
        return selected;
      }
      setIsKeyConfigured(false);
      return false;
    } catch (e) {
      console.warn("Key selection check failed:", e);
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
      
      // Special handling for the required session key errors
      if (msg.includes("Requested entity was not found") || msg.includes("API_KEY_INVALID")) {
        setError("API Session expired or key is invalid. Please reconnect.");
        setIsKeyConfigured(false);
      } else {
        setError(msg || "Failed to fetch market data. Ensure your key is from a paid project.");
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
      } else {
        // If not ready on mount, we show the setup screen
        setIsKeyConfigured(false);
      }
    };
    init();
    
    const intervalId = setInterval(() => {
      if (isKeyConfigured) loadRates();
    }, 300000); // Auto-refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [loadRates, checkKey, isKeyConfigured]);

  const handleCurrencyChange = useCallback((from: CurrencyCode, to: CurrencyCode) => {
    setSelection({ from, to });
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore - aistudio is provided by the environment
      if (window.aistudio) {
        // @ts-ignore - openSelectKey is provided by the environment
        await window.aistudio.openSelectKey();
        // Platform Rule: Assume success and proceed to prevent race conditions
        setIsKeyConfigured(true);
        setError(null);
        // Small delay to allow session state to propagate
        setTimeout(loadRates, 800);
      } else {
        setError("AI Studio selector not available in this environment.");
      }
    } catch (err) {
      console.error("Failed to open key selector", err);
      setError("Failed to open connection dialog.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="text-center space-y-4">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm">
            AI-Powered Market Grounding
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Global FX Hub
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Professional-grade currency analysis using real-time search data and historical trends.
          </p>
        </header>

        {!isKeyConfigured ? (
          <div className="bg-white rounded-3xl p-12 shadow-2xl border border-slate-200 text-center space-y-8 max-w-lg mx-auto transform transition-all hover:scale-[1.01]">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto rotate-3 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Setup Connection</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                To fetch live market rates, you must connect a Gemini API Key from a paid Google Cloud project.
              </p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={handleOpenKeySelector}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 px-8 rounded-2xl transition-all shadow-xl hover:shadow-indigo-200 active:scale-95 flex items-center justify-center space-x-3"
              >
                <span>Authorize API Access</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <div className="flex flex-col space-y-2">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 font-bold hover:underline">
                  Learn about API Billing & Keys →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-2xl flex flex-col space-y-3 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-rose-800 font-bold tracking-tight">Connection Issue</p>
                    <p className="text-xs text-rose-600">{error}</p>
                  </div>
                  <button onClick={loadRates} className="ml-auto bg-white text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors">Retry</button>
                </div>
              </div>
            )}

            {data ? (
              <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
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

                <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 group transition-all hover:shadow-md">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Market Intel</h3>
                  </div>
                  
                  <div className="prose prose-slate max-w-none text-slate-600 leading-loose mb-10">
                    <p className="whitespace-pre-wrap">{data.summary}</p>
                  </div>

                  {data.sources && data.sources.length > 0 && (
                    <div className="pt-8 border-t border-slate-50">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Grounded Sources</h4>
                      <div className="flex flex-wrap gap-3">
                        {data.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-[11px] font-bold bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all"
                          >
                            <span className="truncate max-w-[150px]">{source.title}</span>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="bg-white rounded-3xl h-[450px] border border-slate-100"></div>
                  <div className="bg-white rounded-3xl h-[450px] border border-slate-100"></div>
                </div>
                <div className="bg-white rounded-3xl h-64 border border-slate-100 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Grounding Search Results...</p>
                </div>
              </div>
            )}
          </>
        )}

        <footer className="text-center pt-12 border-t border-slate-100">
          <p className="text-slate-400 text-[11px] font-medium tracking-wide">
            DATA PROVIDED BY GOOGLE SEARCH • SYNCED EVERY 5 MINS • © {new Date().getFullYear()} GLOBAL FX HUB
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
