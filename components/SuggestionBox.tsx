
import React, { useState } from 'react';

interface SuggestionBoxProps {
  onSend: (message: string) => void;
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl shadow-sm border border-indigo-100">
      <div className="flex items-center space-x-2 mb-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Sugestão ao ADM</h4>
      </div>
      
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        Tem alguma ideia para melhorar nosso consultório? Mande direto para o administrador!
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua sugestão aqui..."
          className="w-full h-24 p-3 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none text-slate-900"
        />
        <button
          type="submit"
          disabled={!text.trim() || sent}
          className={`w-full py-3 rounded-xl font-bold text-xs transition transform active:scale-95 shadow-lg ${
            sent 
              ? 'bg-green-500 text-white' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {sent ? 'Sugestão Enviada! ✅' : 'Enviar Sugestão'}
        </button>
      </form>
    </div>
  );
};

export default SuggestionBox;
