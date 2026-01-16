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
  
  // Manual Rate Override States
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [manualRate, setManualRate] = useState<string>('');
  const [overriddenRate, setOverriddenRate] = useState<{from: string, to: string, rate: number} | null>(null);

  useEffect(() => {
    onCurrencyChange(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency, onCurrencyChange]);

  const availableCurrencies = useMemo(() => {
    return ['USD', 'EUR', 'JPY', 'INR'] as CurrencyCode[];
  }, []);

  useEffect(() => {
    if (!isEditingRate) {
      setOverriddenRate(null);
    }
  }, [fromCurrency, toCurrency]);

  const convert = (val: number, from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return val;
    if (overriddenRate && overriddenRate.from === from && overriddenRate.to === to) {
      return val * overriddenRate.rate;
    }

    let usdAmount = val;
    if (from === 'EUR') usdAmount = val / rates.USD_EUR;
    if (from === 'JPY') usdAmount = val / rates.USD_JPY;
    if (from === 'INR') usdAmount = val / rates.USD_INR;

    if (to === 'USD') return usdAmount;
    if (to === 'EUR') return usdAmount * rates.USD_EUR;
    if (to === 'JPY') return usdAmount * rates.USD_JPY;
    if (to === 'INR') return usdAmount * rates.USD_INR;
    
    return val;
  };

  const result = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 0;
    return convert(num, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency, rates, overriddenRate]);

  const liveRateValue = useMemo(() => {
    return convert(1, fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prevFrom);
    setOverriddenRate(null);
  };

  const handleStartEdit = () => {
    setManualRate((overriddenRate?.rate || liveRateValue).toFixed(4));
    setIsEditingRate(true);
  };

  const handleSaveRate = () => {
    const newRate = parseFloat(manualRate);
    if (!isNaN(newRate) && newRate > 0) {
      setOverriddenRate({ from: fromCurrency, to: toCurrency, rate: newRate });
    }
    setIsEditingRate(false);
  };

  const handleResetRate = () => {
    setOverriddenRate(null);
    setIsEditingRate(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 w-full max-w-2xl mx-auto border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Currency Converter</h2>
        <div className="hidden sm:block text-xs font-medium text-slate-400">
          Last updated: {new Date(rates.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
        <div className="md:col-span-3 space-y-2">
          <label className="block text-sm font-medium text-gray-500">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="0.00"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <select 
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-bold text-gray-700 cursor-pointer focus:outline-none"
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
            className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
          >
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="md:col-span-3 space-y-2">
          <label className="block text-sm font-medium text-gray-500">Converted To</label>
          <div className="relative">
            <div className={`w-full ${overriddenRate ? 'bg-indigo-600' : 'bg-blue-600'} border border-blue-700 text-white rounded-xl px-4 py-4 text-xl font-bold min-h-[66px] flex items-center shadow-lg transition-colors overflow-hidden`}>
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <select 
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-bold text-white cursor-pointer focus:outline-none"
              >
                {availableCurrencies.map(curr => (
                  <option key={curr} value={curr} className="text-gray-800">{curr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col space-y-4">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          {isEditingRate ? (
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Custom Conversion Rate</label>
                <div className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
                  <span>1 {fromCurrency} = </span>
                  <input 
                    type="number"
                    step="0.0001"
                    value={manualRate}
                    onChange={(e) => setManualRate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 w-24 text-blue-600 font-bold focus:ring-1 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  <span>{toCurrency}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleSaveRate}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
                <button 
                  onClick={handleResetRate}
                  className="bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Current Conversion Rate</span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-800 font-semibold">
                    1 {fromCurrency} = {(overriddenRate?.rate || liveRateValue).toFixed(4)} {toCurrency}
                  </span>
                  {overriddenRate && (
                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      User Defined
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleStartEdit}
                className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <PencilSquareIcon className="w-4 h-4" />
                <span className="text-xs font-bold">Edit Rate</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Updating Market Rates...' : 'Refresh Live Data'}</span>
        </button>

        <div className="pt-2 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-green-500 animate-pulse'}`}></span>
            <span>{isLoading ? 'Fetching Latest Data...' : 'Gemini AI Grounding Active'}</span>
          </div>
          {overriddenRate && (
            <button 
              onClick={handleResetRate}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Reset to Market Rate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ArrowsRightLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const PencilSquareIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);