
import React, { useState } from 'react';
import { UserProfile, GoalType } from '../types';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit }) => {
  // Usamos strings no estado inicial para que o usuário consiga digitar livremente
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    activityLevel: 'moderate',
    goalType: 'weight_loss' as GoalType,
    weight: '',
    height: '',
    age: '',
    goalWeight: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar e converter para os tipos corretos antes de enviar
    const weightNum = parseFloat(formData.weight);
    const heightNum = parseFloat(formData.height);
    const ageNum = parseInt(formData.age);
    const goalWeightNum = parseFloat(formData.goalWeight);

    if (formData.name && weightNum && heightNum && ageNum && goalWeightNum) {
      onSubmit({
        ...formData,
        weight: weightNum,
        height: heightNum,
        age: ageNum,
        goalWeight: goalWeightNum,
      } as UserProfile);
    } else {
      alert("Por favor, preencha todos os campos corretamente com números válidos.");
    }
  };

  const inputClass = "w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-slate-900 bg-white placeholder:text-slate-400";

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-10 p-8 border border-green-100">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Seja bem-vindo à Nutri-AI Expert</h2>
        <p className="text-slate-500">Vamos configurar seu perfil para começar sua jornada.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
          <input
            required
            type="text"
            name="name"
            value={formData.name}
            placeholder="Ex: Maria Silva"
            className={inputClass}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Qual seu foco principal?</label>
          <select
            name="goalType"
            value={formData.goalType}
            className={inputClass}
            onChange={handleChange}
          >
            <option value="weight_loss">Perder Peso (Geral)</option>
            <option value="belly_fat">Perder Barriga (Gordura Abdominal)</option>
            <option value="muscle_gain">Ganhar Massa (Hipertrofia)</option>
            <option value="definition">Definição Muscular</option>
            <option value="health">Saúde e Bem-estar</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Peso Atual (kg)</label>
            <input
              required
              type="number"
              step="0.1"
              name="weight"
              value={formData.weight}
              placeholder="70"
              className={inputClass}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Altura (cm)</label>
            <input
              required
              type="number"
              name="height"
              value={formData.height}
              placeholder="170"
              className={inputClass}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Idade</label>
            <input
              required
              type="number"
              name="age"
              value={formData.age}
              placeholder="25"
              className={inputClass}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Sexo</label>
            <select
              name="gender"
              value={formData.gender}
              className={inputClass}
              onChange={handleChange}
            >
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Meta de Peso (kg)</label>
            <input
              required
              type="number"
              step="0.1"
              name="goalWeight"
              value={formData.goalWeight}
              placeholder="65"
              className={inputClass}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nível de Atividade</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              className={inputClass}
              onChange={handleChange}
            >
              <option value="sedentary">Sedentário</option>
              <option value="light">Leve (1-2x/sem)</option>
              <option value="moderate">Moderado (3-5x/sem)</option>
              <option value="active">Ativo (6-7x/sem)</option>
              <option value="very_active">Atleta (2x/dia)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition transform hover:-translate-y-1 mt-6"
        >
          Calcular Meu Plano Agora
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
