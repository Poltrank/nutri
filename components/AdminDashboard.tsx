
import React, { useState, useEffect } from 'react';
import { AuthUser, Suggestion } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('nutri_users') || '[]');
    const savedSuggestions = JSON.parse(localStorage.getItem('nutri_suggestions') || '[]');
    setUsers(savedUsers);
    setSuggestions(savedSuggestions);
  }, []);

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Todos os dados dele serão perdidos.")) {
      const updatedUsers = users.filter(u => u.id !== id);
      localStorage.setItem('nutri_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  const handleDeleteSuggestion = (id: string) => {
    const updatedSuggestions = suggestions.filter(s => s.id !== id);
    localStorage.setItem('nutri_suggestions', JSON.stringify(updatedSuggestions));
    setSuggestions(updatedSuggestions);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Painel de Controle <span className="text-green-600">ADM</span></h1>
            <p className="text-slate-500">Gerenciamento de pacientes e sugestões da plataforma.</p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-white text-red-600 font-bold border border-red-100 rounded-2xl hover:bg-red-50 transition shadow-sm"
          >
            Sair do Painel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Pacientes</span>
            <div className="text-5xl font-black text-slate-800 mt-2">{users.length}</div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sugestões Recebidas</span>
            <div className="text-5xl font-black text-indigo-600 mt-2">{suggestions.length}</div>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-2 h-8 bg-green-500 rounded-full mr-3"></span>
            Lista de Pacientes
          </h2>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nome</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">E-mail</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status Perfil</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">Nenhum paciente cadastrado ainda.</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700">{user.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{user.email}</td>
                        <td className="px-6 py-4">
                          {user.profile ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Configurado</span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Pendente</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-600 p-2 transition"
                            title="Excluir Usuário"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
            Sugestões de Melhoria
          </h2>
          {suggestions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
              <p className="text-slate-400">Nenhuma sugestão recebida por enquanto. 📬</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-50 relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-800">{s.userName}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{s.date}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSuggestion(s.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-indigo-50/50 p-4 rounded-2xl text-slate-600 text-sm italic leading-relaxed">
                    "{s.message}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
