
import React from 'react';
import { WeightEntry } from '../types';

interface WeightChartProps {
  history: WeightEntry[];
}

const WeightChart: React.FC<WeightChartProps> = ({ history }) => {
  if (history.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-xs text-slate-400 text-center px-4">
          Registre seu peso mais vezes para ver o gráfico de evolução aparecer aqui! 📈
        </p>
      </div>
    );
  }

  const weights = history.map(h => h.weight);
  const minWeight = Math.min(...weights) - 2;
  const maxWeight = Math.max(...weights) + 2;
  const range = maxWeight - minWeight;

  const width = 300;
  const height = 100;
  const padding = 10;

  const points = history.map((entry, i) => {
    const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((entry.weight - minWeight) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Sua Evolução</h5>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area under line */}
        <path
          d={`M ${points.split(' ')[0]} L ${points} L ${width - padding},${height} L ${padding},${height} Z`}
          fill="url(#lineGradient)"
        />
        
        {/* The line itself */}
        <polyline
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Dots */}
        {history.map((entry, i) => {
          const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
          const y = height - ((entry.weight - minWeight) / range) * (height - padding * 2) - padding;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#ffffff" stroke="#16a34a" strokeWidth="2" />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-bold text-slate-400">{history[0].weight}kg</span>
        <span className="text-[10px] font-bold text-green-600">{history[history.length - 1].weight}kg</span>
      </div>
    </div>
  );
};

export default WeightChart;
