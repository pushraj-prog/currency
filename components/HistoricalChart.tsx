import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { HistoricalPoint, CurrencyCode } from '../types';

interface Props {
  data: HistoricalPoint[];
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
}

const HistoricalChart: React.FC<Props> = ({ data, fromCurrency, toCurrency }) => {
  const chartData = useMemo(() => {
    // We need to calculate the conversion for the specific pair requested
    // Base is USD for our historical points
    return data.map(point => {
      let value = 1;
      
      // Conversion logic: Base is USD
      // If from USD: simple
      // If from EUR: value = point[to] / point[EUR]
      const getVal = (code: CurrencyCode) => {
        if (code === 'USD') return 1;
        if (code === 'EUR') return point.USD_EUR;
        if (code === 'JPY') return point.USD_JPY;
        if (code === 'INR') return point.USD_INR;
        return 1;
      };

      const fromVal = getVal(fromCurrency);
      const toVal = getVal(toCurrency);
      value = toVal / fromVal;

      return {
        date: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rate: value
      };
    });
  }, [data, fromCurrency, toCurrency]);

  const minVal = Math.min(...chartData.map(d => d.rate));
  const maxVal = Math.max(...chartData.map(d => d.rate));
  const buffer = (maxVal - minVal) * 0.1;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-[400px] w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <span className="bg-blue-600 w-1.5 h-6 rounded-full mr-3"></span>
          Historical Trend ({fromCurrency}/{toCurrency})
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">7-Day Analysis</span>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            domain={[minVal - buffer, maxVal + buffer]}
            hide={false}
            width={40}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="rate" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalChart;