
import React, { useState, useMemo, useEffect } from 'react';
import { CurrencyCode, ExchangeRates } from '../types';

interface Props {
  rates: ExchangeRates;
  onRefresh: () => void;
  isLoading: boolean;
  onCurrencyChange: (from: CurrencyCode, to: CurrencyCode) => void;
}

const CurrencyConverter: React.FC<Props> = ({ rates, onRefresh, isLoading, onCurrencyChange }) => {
  const [amount, setAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('INR');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualRate, setManualRate] = useState<string>('');

  useEffect(() => {
    onCurrencyChange(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency, onCurrencyChange]);

  const availableCurrencies = useMemo(() => {
    return ['USD', 'EUR', 'JPY', 'INR'] as CurrencyCode[];
  }, []);

  const getLiveRate = (from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return 1;

    // Convert from 'from' to USD first
    let fromInUsd = 1;
    if (from === 'EUR') fromInUsd = 1 / rates.USD_EUR;
    else if (from === 'JPY') fromInUsd = 1 / rates.USD_JPY;
    else if (from === 'INR') fromInUsd = 1 / rates.USD_INR;

    // Convert from USD to 'to'
    let toRate = 1;
    if (to === 'EUR') toRate = fromInUsd * rates.USD_EUR;
    else if (to === 'JPY') toRate = fromInUsd * rates.USD_JPY;
    else if (to === 'INR') toRate = fromInUsd * rates.USD_INR;
    else if (to === 'USD') toRate = fromInUsd;

    return toRate;
  };

  const currentLiveRate = useMemo(() => getLiveRate(fromCurrency, toCurrency), [fromCurrency, toCurrency, rates]);

  // Sync manual rate when switching to manual mode or changing currencies if manual mode is off
  useEffect(() => {
    if (!isManualMode) {
      setManualRate(currentLiveRate.toFixed(4));
    }
  }, [currentLiveRate, isManualMode]);

  const effectiveRate = isManualMode ? parseFloat(manualRate) || 0 : currentLiveRate;

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    return num * effectiveRate;
  }, [amount, effectiveRate]);

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prevFrom);
    // When swapping, we likely want to revert to live rates to avoid confusion with inverted custom rates
    setIsManualMode(false);
  };

  const toggleManualMode = () => {
    if (!isManualMode) {
      setManualRate(currentLiveRate.toFixed(4));
    }
    setIsManualMode(!isManualMode);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 w-full max-w-2xl mx-auto border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Currency Converter</h2>
          <p className="text-sm text-slate-400 mt-1">Convert between USD, EUR, JPY, and INR</p>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Last Sync</div>
          <div className="text-xs font-bold text-slate-600">{new Date(rates.lastUpdated).toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
        <div className="md:col-span-3 space-y-2">
          <label className="block text-sm font-semibold text-gray-500 ml-1">You Send</label>
          <div className="relative group">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-5 text-xl font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all"
              placeholder="0.00"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <select 
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 font-bold text-gray-700 cursor-pointer focus:outline-none hover:border-blue-400 transition-colors shadow-sm"
              >
                {availableCurrencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 flex justify-center pb-2">
          <button 
            onClick={handleSwap}
            title="Swap Currencies"
            className="p-4 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 hover:scale-110 active:scale-95 transition-all border border-blue-100 shadow-sm"
          >
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="md:col-span-3 space-y-2">
          <label className="block text-sm font-semibold text-gray-500 ml-1">They Receive</label>
          <div className="relative group">
            <div className="w-full bg-blue-600 border border-blue-700 text-white rounded-2xl px-5 py-5 text-xl font-extrabold min-h-[70px] flex items-center shadow-lg transition-all group-hover:bg-blue-700">
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <select 
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
                className="bg-blue-500 border border-blue-400 rounded-lg px-2 py-1 font-bold text-white cursor-pointer focus:outline-none hover:bg-blue-400 transition-colors"
              >
                {availableCurrencies.map(curr => (
                  <option key={curr} value={curr} className="text-gray-800 bg-white">{curr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className={`rounded-2xl p-5 border transition-all duration-300 ${isManualMode ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  {isManualMode ? 'Manual Conversion Rate' : 'Live Market Rate'}
                </span>
                {isManualMode && (
                  <span className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase animate-pulse">Manual</span>
                )}
              </div>
              <div className="flex items-center space-x-3 mt-1">
                {isManualMode ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-800 font-bold text-lg">1 {fromCurrency} =</span>
                    <input 
                      type="number"
                      step="0.0001"
                      value={manualRate}
                      onChange={(e) => setManualRate(e.target.value)}
                      className="w-32 bg-white border border-amber-300 rounded-lg px-2 py-1 text-lg font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <span className="text-slate-800 font-bold text-lg">{toCurrency}</span>
                  </div>
                ) : (
                  <span className="text-slate-800 font-bold text-xl tracking-tight">
                    1 {fromCurrency} = {currentLiveRate.toFixed(4)} {toCurrency}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={toggleManualMode}
              className={`p-3 rounded-xl transition-all shadow-sm flex items-center space-x-2 text-sm font-bold ${isManualMode ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-white text-blue-600 hover:bg-blue-50 border border-slate-200'}`}
            >
              {isManualMode ? <CheckIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
              <span>{isManualMode ? 'Save Rate' : 'Edit Rate'}</span>
            </button>
          </div>
          {isManualMode && (
            <p className="text-[10px] text-amber-600 mt-2 font-medium">
              Manual mode is active. Conversions will use your custom rate instead of Gemini's live data.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-slate-200"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Market Data'}</span>
          </button>

          {isManualMode && (
            <button
              onClick={() => setIsManualMode(false)}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] shadow-sm"
            >
              <ResetIcon className="w-5 h-5" />
              <span>Reset to Live</span>
            </button>
          )}
        </div>

        <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-gray-400 font-medium">
          <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400' : isManualMode ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`}></span>
          <span>
            {isLoading 
              ? 'Gemini is searching current markets...' 
              : isManualMode 
                ? 'Manual Override Active' 
                : 'Real-time Grounding Active'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ArrowsRightLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ResetIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12" />
  </svg>
);
