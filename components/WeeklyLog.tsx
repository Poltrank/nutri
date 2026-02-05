
import React from 'react';
import { DailyIntake } from '../types';

interface WeeklyLogProps {
  currentLog: string;
  currentMacros?: DailyIntake;
  onLogChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const WeeklyLogComponent: React.FC<WeeklyLogProps> = ({ currentLog, currentMacros, onLogChange, onAnalyze, isLoading }) => {
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayDisplay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  return (
    <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <svg className="w-32 h-32 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10">
        <div>
          <div className="flex items-center space-x-2 mb-1">
             <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">Hoje</span>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">{dayDisplay}</h3>
          </div>
          <p className="text-slate-400 font-bold text-sm">{dateFormatted}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
           <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center">
             <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizado</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative z-10">
        <div className="lg:col-span-2 space-y-4">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">O que você comeu hoje?</label>
          <textarea
            value={currentLog}
            onChange={(e) => onLogChange(e.target.value)}
            placeholder="Ex: Café: Omelete de 2 ovos e café s/ açúcar. Almoço: 150g de frango grelhado, 100g de arroz integral e salada à vontade..."
            className="w-full h-48 md:h-64 p-6 text-lg bg-slate-50 border-2 border-slate-100 rounded-[32px] focus:ring-4 focus:ring-green-500/10 focus:bg-white focus:border-green-500 outline-none transition-all resize-none placeholder:text-slate-300 text-slate-700 font-medium leading-relaxed"
          />
          
          <button
            onClick={onAnalyze}
            disabled={isLoading || !currentLog.trim()}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-[24px] shadow-2xl hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center space-x-3 group"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-sm uppercase tracking-widest">Analisar com Inteligência Artificial</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status Nutricional</label>
          
          {currentMacros && currentMacros.calories > 0 ? (
            <div className="bg-green-50 rounded-[32px] p-6 border border-green-100 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-6">
                 <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mb-1">Total Consumido</span>
                 <div className="text-4xl font-black text-green-800">{Math.round(currentMacros.calories)}<span className="text-lg ml-1">kcal</span></div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Proteína', val: currentMacros.protein, unit: 'g', color: 'text-blue-700', bg: 'bg-blue-100' },
                  { label: 'Carbos', val: currentMacros.carbs, unit: 'g', color: 'text-amber-700', bg: 'bg-amber-100' },
                  { label: 'Gorduras', val: currentMacros.fats, unit: 'g', color: 'text-rose-700', bg: 'bg-rose-100' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between bg-white/60 p-4 rounded-2xl">
                    <span className="text-xs font-black text-slate-500 uppercase">{m.label}</span>
                    <span className={`font-black ${m.color}`}>{Math.round(m.val)}{m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Escreva suas refeições ao lado e clique em analisar para ver os macros aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyLogComponent;
