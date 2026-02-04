
import React, { useState } from 'react';
import { AuthUser } from '../types';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Lógica do Administrador
    if (email === 'adm' && password === 'caralho87') {
      onLogin({
        id: 'admin-id',
        email: 'adm',
        name: 'Administrador',
        isAdmin: true
      });
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('nutri_users') || '[]');
    const user = savedUsers.find((u: AuthUser) => u.email === email && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      alert("E-mail ou senha incorretos. (Dica: adm / caralho87 para admin)");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('nutri_users') || '[]');
    if (savedUsers.find((u: AuthUser) => u.email === email)) {
      alert("Este e-mail já está cadastrado!");
      return;
    }

    const newUser: AuthUser = {
      id: Date.now().toString(),
      name,
      email,
      password
    };

    localStorage.setItem('nutri_users', JSON.stringify([...savedUsers, newUser]));
    alert("Conta criada com sucesso! Agora faça seu login.");
    setIsRegistering(false);
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition text-slate-900 font-medium placeholder:text-slate-400";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-slate-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100">
        <div className="bg-green-600 p-8 text-center text-white">
          <div className="inline-block p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight">NUTRI-AI EXPERT</h1>
          <p className="text-green-100 text-sm mt-1 opacity-90">Sua jornada saudável começa aqui.</p>
        </div>

        <div className="p-8">
          <div className="flex mb-8 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isRegistering ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isRegistering ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className={inputStyle}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Login / E-mail</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: joao@email.com"
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition transform active:scale-95"
            >
              {isRegistering ? 'Cadastrar Agora' : 'Acessar Consultório'}
            </button>
          </form>

          {!isRegistering && (
            <p className="mt-6 text-center text-xs text-slate-400">
              Esqueceu sua senha? Entre em contato com o suporte.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
