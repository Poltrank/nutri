
import React from 'react';
import { DayOfWeek, WeeklyLog, DailyIntake } from '../types';

interface WeeklyLogProps {
  logs: WeeklyLog;
  savedMacros?: Partial<Record<DayOfWeek, DailyIntake>>;
  onLogChange: (day: DayOfWeek, value: string) => void;
  onAnalyze: (day: DayOfWeek) => void;
  isLoading: boolean;
}

const WeeklyLogComponent: React.FC<WeeklyLogProps> = ({ logs, savedMacros, onLogChange, onAnalyze, isLoading }) => {
  const days: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Diário Alimentar</h3>
          <p className="text-sm text-slate-500">Escreva, edite e analise sua rotina.</p>
        </div>
        <div className="bg-green-100 p-3 rounded-2xl">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayMacros = savedMacros?.[day];
          const hasContent = logs[day]?.trim().length > 0;

          return (
            <div key={day} className="flex flex-col space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</label>
                {hasContent && (
                   <button 
                     onClick={() => onLogChange(day, '')}
                     className="text-slate-300 hover:text-red-400 transition-colors"
                     title="Limpar dia"
                   >
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <textarea
                  value={logs[day] || ''}
                  onChange={(e) => onLogChange(day, e.target.value)}
                  placeholder="Ex: Almoço: 150g frango, arroz e salada..."
                  className="w-full h-28 p-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white focus:border-transparent outline-none transition resize-none placeholder:text-slate-300 text-slate-700 font-medium"
                />
                
                {/* Indicador de Macros do Dia */}
                {dayMacros && dayMacros.calories > 0 && (
                  <div className="bg-green-50 rounded-xl p-2 border border-green-100 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-green-700 uppercase">Salvo</span>
                      <span className="text-[10px] font-bold text-green-800">{Math.round(dayMacros.calories)}kcal</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="flex-1 bg-white rounded-lg p-1 text-center">
                        <p className="text-[8px] text-slate-400 uppercase font-bold">P</p>
                        <p className="text-[10px] font-black text-slate-700">{Math.round(dayMacros.protein)}g</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-1 text-center">
                        <p className="text-[8px] text-slate-400 uppercase font-bold">C</p>
                        <p className="text-[10px] font-black text-slate-700">{Math.round(dayMacros.carbs)}g</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-1 text-center">
                        <p className="text-[8px] text-slate-400 uppercase font-bold">G</p>
                        <p className="text-[10px] font-black text-slate-700">{Math.round(dayMacros.fats)}g</p>
                      </div>
                    </div>
                  </div>
                )}

                {hasContent && (
                  <button
                    onClick={() => onAnalyze(day)}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center space-x-1"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span>{dayMacros ? 'Re-analisar' : 'Analisar'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyLogComponent;
