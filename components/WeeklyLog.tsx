
import React from 'react';
import { DayOfWeek, WeeklyLog } from '../types';

interface WeeklyLogProps {
  logs: WeeklyLog;
  onLogChange: (day: DayOfWeek, value: string) => void;
  onAnalyze: (day: DayOfWeek) => void;
  isLoading: boolean;
}

const WeeklyLogComponent: React.FC<WeeklyLogProps> = ({ logs, onLogChange, onAnalyze, isLoading }) => {
  const days: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Diário da Semana</h3>
          <p className="text-sm text-slate-500">Registre o que você comeu em cada dia para análise.</p>
        </div>
        <div className="bg-green-100 p-2 rounded-lg">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {days.map((day) => (
          <div key={day} className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter ml-1">{day}</label>
            <div className="group relative">
              <textarea
                value={logs[day]}
                onChange={(e) => onLogChange(day, e.target.value)}
                placeholder="Ex: Omelete, Arroz..."
                className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition resize-none placeholder:text-slate-300"
              />
              {logs[day].trim() && (
                <button
                  onClick={() => onAnalyze(day)}
                  disabled={isLoading}
                  className="absolute bottom-2 right-2 p-1.5 bg-green-600 text-white rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition shadow-lg disabled:opacity-50"
                  title={`Analisar ${day}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyLogComponent;
