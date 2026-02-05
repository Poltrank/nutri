
import React, { useState } from 'react';
import { AuthUser } from '../types';
import { auth, db } from '../services/firebaseService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Lógica do Administrador Local (Opcional, pode ser migrada para Firebase Roles depois)
    if (email === 'adm' && password === 'caralho87') {
      onLogin({ id: 'admin-id', email: 'adm', name: 'Administrador', isAdmin: true });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        onLogin(userSnap.data() as AuthUser);
      } else {
        // Fallback caso o registro no firestore tenha falhado mas o auth funcionou
        onLogin({ id: firebaseUser.uid, email: firebaseUser.email!, name: firebaseUser.displayName || 'Usuário' });
      }
    } catch (error: any) {
      alert("Erro ao entrar: " + (error.message || "Verifique suas credenciais."));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert("Preencha todos os campos!");
      return;
    }
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newUser: AuthUser = {
        id: firebaseUser.uid,
        name,
        email,
        weightHistory: [],
        manualIntake: {},
        logMacros: {},
        mealLogs: {}
      };

      // Salva os dados iniciais no Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
      
      alert("Conta criada com sucesso!");
      onLogin(newUser);
    } catch (error: any) {
      alert("Erro ao cadastrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition text-slate-900 font-medium placeholder:text-slate-400 disabled:opacity-50";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-slate-100">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100">
        <div className="bg-green-600 p-8 text-center text-white">
          <div className="inline-block p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Nutri-AI Expert</h1>
          <p className="text-green-100 text-sm mt-1 opacity-90">Seu consultório digital na nuvem.</p>
        </div>

        <div className="p-8">
          <div className="flex mb-8 bg-slate-100 p-1 rounded-xl">
            <button
              disabled={loading}
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isRegistering ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
            >
              Entrar
            </button>
            <button
              disabled={loading}
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isRegistering ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
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
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className={inputStyle}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1 tracking-wider">E-mail</label>
              <input
                type="email"
                value={email}
                disabled={loading}
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
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-100 transition transform active:scale-95 disabled:bg-slate-300 flex items-center justify-center space-x-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              <span>{isRegistering ? 'Cadastrar Agora' : 'Acessar Consultório'}</span>
            </button>
          </form>

          {!isRegistering && (
            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-slate-400">Dados protegidos pelo Google Firebase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
