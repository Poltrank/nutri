
import React, { useState } from 'react';
import { UserProfile, MacroCalculations, DailyIntake } from '../types';

interface DashboardProps {
  profile: UserProfile;
  macros: MacroCalculations;
  intake: DailyIntake;
  onUpdateWeight: (newWeight: number) => void;
  onUpdateIntake: (type: keyof DailyIntake, value: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, macros, intake, onUpdateWeight, onUpdateIntake }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempWeight, setTempWeight] = useState(profile.weight.toString());

  const handleWeightSave = () => {
    const weight = parseFloat(tempWeight);
    if (!isNaN(weight) && weight > 0) {
      onUpdateWeight(weight);
      setIsEditing(false);
    }
  };

  // Lógica do Semáforo Nutricional
  const getStatus = (current: number, target: number, type: 'protein' | 'calories' | 'other') => {
    const percentage = (current / target) * 100;
    
    if (type === 'protein') {
      if (percentage < 60) return { color: 'bg-red-500', text: 'Ruim (Muito Baixo)', label: 'Ótimo' };
      if (percentage < 90) return { color: 'bg-amber-500', text: 'Alerta (Aumente)', label: 'Ótimo' };
      return { color: 'bg-green-500', text: 'Ótimo (Meta Batida)', label: 'Ótimo' };
    } else {
      if (percentage < 70) return { color: 'bg-blue-400', text: 'Em Progresso', label: 'Meta' };
      if (percentage <= 105) return { color: 'bg-green-500', text: 'Ótimo (Na Meta)', label: 'Meta' };
      if (percentage <= 115) return { color: 'bg-amber-500', text: 'Alerta (Limite)', label: 'Meta' };
      return { color: 'bg-red-500', text: 'Ruim (Excedeu)', label: 'Meta' };
    }
  };

  const MacroCard = ({ 
    label, 
    icon,
    current, 
    target, 
    unit, 
    type 
  }: { 
    label: string, 
    icon: string,
    current: number, 
    target: number, 
    unit: string, 
    type: 'protein' | 'calories' | 'other'
  }) => {
    const status = getStatus(current, target, type);
    const percentage = Math.min((current / target) * 100, 100);

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group transition-all hover:shadow-md relative overflow-hidden">
        {/* Indicador de Cor Lateral (Semáforo) */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.color}`} />
        
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Hoje</span>
            <span className="text-xs font-bold text-slate-700 flex items-center">
              {icon} <span className="ml-1">{label}</span>
            </span>
          </div>
          <button 
            title="Lançar Consumo Diário"
            onClick={() => {
              const val = prompt(`Quantas ${unit} de ${label.toLowerCase()} você consumiu agora?`, "0");
              if (val) onUpdateIntake(type === 'calories' ? 'calories' : label.toLowerCase().includes('prote') ? 'protein' : label.toLowerCase().includes('carb') ? 'carbs' : 'fats' as any, parseFloat(val));
            }}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-green-600 hover:text-white transition-all transform active:scale-90 shadow-sm border border-slate-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex items-baseline my-3">
          <span className="text-3xl font-black text-slate-800 tracking-tighter">{Math.round(current)}</span>
          <span className="text-slate-400 text-xs font-bold mx-1">/</span>
          <span className="text-slate-500 font-bold text-sm">{target}{unit}</span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${status.color} ${percentage >= 100 ? 'animate-pulse' : ''}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${status.color.replace('bg-', 'text-').replace('500', '700')} bg-opacity-10`}>
              {status.text}
            </span>
            <span className="text-[10px] font-black text-slate-900">{Math.round(percentage)}%</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-dashed border-slate-100">
           <p className="text-[9px] text-slate-400 font-bold uppercase">
             {type === 'protein' ? '🎯 Objetivo: Mínimo' : '⚠️ Objetivo: Não Exceder'}
           </p>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Card de Peso - Foco em Evolução */}
      <div 
        className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
          isEditing ? 'ring-2 ring-green-500 border-transparent' : 'border-green-100 hover:bg-green-50/20'
        }`}
        onClick={() => !isEditing && setIsEditing(true)}
      >
        <div className="absolute right-0 top-0 p-2 opacity-10">
           <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3a9 9 0 00-9 9 9 9 0 009 9 9 9 0 009-9 9 9 0 00-9-9m0 2a7 7 0 017 7 7 7 0 01-7 7 7 7 0 01-7-7 7 7 0 017-7m-1 3v4H7v2h4v4h2v-4h4v-2h-4V8h-2z"/></svg>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-600 text-[10px] font-black uppercase tracking-widest flex items-center">
            ⚖️ Peso Atual
          </span>
          {!isEditing && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">EDITAR</span>}
        </div>

        <div className="flex items-center">
          {isEditing ? (
            <div className="flex items-center space-x-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="number" step="0.1" value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                className="w-full text-3xl font-black border-b-2 border-green-500 outline-none text-slate-900 bg-transparent"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleWeightSave()}
              />
              <button onClick={handleWeightSave} className="bg-green-600 text-white p-2 rounded-xl shadow-lg transform active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-baseline group-hover:translate-x-1 transition-transform origin-left">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">{profile.weight}</span>
              <span className="text-slate-400 ml-1 font-bold text-lg">kg</span>
            </div>
          )}
        </div>
        <p className="text-[9px] text-slate-400 mt-4 font-bold uppercase tracking-tight">Toque para atualizar hoje</p>
      </div>

      <MacroCard 
        label="Calorias" 
        icon="⚡"
        current={intake.calories} 
        target={macros.targetCalories} 
        unit="kcal" 
        type="calories"
      />

      <MacroCard 
        label="Proteína" 
        icon="🍗"
        current={intake.protein} 
        target={macros.protein} 
        unit="g" 
        type="protein"
      />

      <MacroCard 
        label="Carbos" 
        icon="🍞"
        current={intake.carbs} 
        target={macros.carbs} 
        unit="g" 
        type="other"
      />

      <MacroCard 
        label="Gorduras" 
        icon="🥑"
        current={intake.fats} 
        target={macros.fats} 
        unit="g" 
        type="other"
      />
    </div>
  );
};

export default Dashboard;
