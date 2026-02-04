
import React, { useState, useEffect, useMemo } from 'react';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';
import ChatWindow from './components/ChatWindow';
import WeeklyLogComponent from './components/WeeklyLog';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import WeightChart from './components/WeightChart';
import SuggestionBox from './components/SuggestionBox';
import { UserProfile, AuthUser, Message, WeeklyLog, DayOfWeek, WeightEntry, Suggestion, DailyIntake } from './types';
import { calculateMacros } from './constants';
import { NutritionChatSession } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<NutritionChatSession | null>(null);
  const [pendingMacros, setPendingMacros] = useState<{data: DailyIntake, day: DayOfWeek} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [weeklyLog, setWeeklyLog] = useState<WeeklyLog>({
    Segunda: '', Terça: '', Quarta: '', Quinta: '', Sexta: '', Sábado: '', Domingo: ''
  });

  const getDayOfWeekPT = () => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[new Date().getDay()] as DayOfWeek;
  };

  const macros = useMemo(() => {
    return currentUser?.profile ? calculateMacros(currentUser.profile) : null;
  }, [currentUser]);

  // Cálculo do Intake Total (Manual + Log de Hoje)
  const combinedIntake = useMemo(() => {
    if (!currentUser) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const manual = currentUser.dailyIntake || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const today = getDayOfWeekPT();
    const logToday = currentUser.logMacros?.[today] || { calories: 0, protein: 0, carbs: 0, fats: 0 };

    return {
      calories: manual.calories + logToday.calories,
      protein: manual.protein + logToday.protein,
      carbs: manual.carbs + logToday.carbs,
      fats: manual.fats + logToday.fats,
    };
  }, [currentUser]);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.profile) {
      const session = new NutritionChatSession(user.profile);
      setChatSession(session);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setChatSession(null);
    setMessages([]);
  };

  const handleUpdateIntake = (type: keyof DailyIntake, value: number) => {
    if (!currentUser) return;
    const currentIntake = currentUser.dailyIntake || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const updatedIntake = { ...currentIntake, [type]: Math.max(0, currentIntake[type] + value) };
    
    saveUserData({ dailyIntake: updatedIntake });
  };

  const saveUserData = (updates: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    const savedUsers = JSON.parse(localStorage.getItem('nutri_users') || '[]');
    const updatedUsers = savedUsers.map((u: AuthUser) => 
      u.id === currentUser.id ? updatedUser : u
    );
    localStorage.setItem('nutri_users', JSON.stringify(updatedUsers));
    setCurrentUser(updatedUser);
  };

  const handleAnalyzeDay = async (day: DayOfWeek) => {
    if (!chatSession || !weeklyLog[day].trim()) return;
    
    setIsLoading(true);
    const mealText = weeklyLog[day];
    
    handleSendMessage(`Analise minha alimentação de ${day}: ${mealText}`);
    setIsChatOpen(true);

    const extractedMacros = await chatSession.analyzeNutritionalContent(mealText);
    if (extractedMacros) {
      // Passamos o dia para o modal saber o que está substituindo
      setPendingMacros({ data: extractedMacros, day });
    }
    setIsLoading(false);
  };

  const confirmPendingMacros = () => {
    if (!pendingMacros || !currentUser) return;
    
    const { data, day } = pendingMacros;
    const currentLogs = currentUser.logMacros || {};
    
    // SUBSTITUIÇÃO: Em vez de somar, definimos o valor para aquele dia específico
    const updatedLogs = {
      ...currentLogs,
      [day]: data
    };

    saveUserData({ logMacros: updatedLogs });
    
    const successMsg: Message = { 
      role: 'model', 
      text: `✅ **Diário de ${day} Atualizado!**<br/>Os valores foram sincronizados com seu Dashboard. Mudanças no texto do diário agora substituem os valores antigos para evitar duplicidade.` 
    };
    setMessages(prev => [...prev, successMsg]);
    setPendingMacros(null);
  };

  const handleUpdateWeight = (newWeight: number) => {
    if (!currentUser || !currentUser.profile) return;
    const newEntry: WeightEntry = { date: new Date().toISOString(), weight: newWeight };
    const history = currentUser.weightHistory || [];
    const updatedHistory = [...history, newEntry];
    const updatedProfile = { ...currentUser.profile, weight: newWeight };
    
    saveUserData({ profile: updatedProfile, weightHistory: updatedHistory });
    handleSendMessage(`Dra, me pesei e agora estou com **${newWeight}kg**.`);
  };

  const handleProfileSubmit = (newProfile: UserProfile) => {
    if (!currentUser) return;
    const initialEntry: WeightEntry = { date: new Date().toISOString(), weight: newProfile.weight };
    const initialIntake = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    
    saveUserData({ 
      profile: newProfile, 
      weightHistory: [initialEntry], 
      dailyIntake: initialIntake,
      logMacros: {} 
    });

    const session = new NutritionChatSession(newProfile);
    setChatSession(session);
    setMessages([{ role: 'user', text: `Olá! Sou ${newProfile.name}. Meta: ${newProfile.goalType}.` }]);
  };

  const handleSendMessage = async (text: string, image?: string) => {
    if (!chatSession) return;
    setMessages(prev => [...prev, { role: 'user', text, image }]);
    setIsLoading(true);
    const response = await chatSession.sendMessage(text, image);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  const handleSendSuggestion = (message: string) => {
    if (!currentUser) return;
    const newSuggestion: Suggestion = {
      id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name, message: message, date: new Date().toLocaleString('pt-BR')
    };
    const saved = JSON.parse(localStorage.getItem('nutri_suggestions') || '[]');
    localStorage.setItem('nutri_suggestions', JSON.stringify([...saved, newSuggestion]));
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  if (currentUser.isAdmin) return <AdminDashboard onLogout={handleLogout} />;
  if (!currentUser.profile) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><ProfileForm onSubmit={handleProfileSubmit} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans relative pb-24">
      {/* MODAL DE CONFIRMAÇÃO DE MACROS */}
      {pendingMacros && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-green-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Sincronizar {pendingMacros.day}?</h3>
                <p className="text-sm text-slate-500">Estes valores substituirão a análise anterior deste dia.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {['calories', 'protein', 'carbs', 'fats'].map((type) => (
                <div key={type} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {type === 'calories' ? '⚡ Calorias' : type === 'protein' ? '🍗 Proteína' : type === 'carbs' ? '🍞 Carbos' : '🥑 Gorduras'}
                  </label>
                  <input 
                    type="number" 
                    value={Math.round((pendingMacros.data as any)[type])}
                    onChange={(e) => setPendingMacros({
                      ...pendingMacros, 
                      data: {...pendingMacros.data, [type]: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full bg-transparent font-black text-xl text-slate-800 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setPendingMacros(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200">Cancelar</button>
              <button onClick={confirmPendingMacros} className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-lg">Confirmar e Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT FLUTUANTE */}
      <div className={`fixed bottom-6 right-6 z-40 transition-all duration-500 transform ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-[350px] shadow-2xl relative">
          <button onClick={() => setIsChatOpen(false)} className="absolute -top-3 -right-3 bg-white text-slate-400 p-2 rounded-full shadow-lg hover:text-red-500 z-50 border border-slate-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition transform hover:scale-110 active:scale-95 z-40 flex items-center space-x-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span className="text-sm font-bold pr-2">Dra. Nutri</span>
        </button>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Olá, <span className="text-green-600">{currentUser.profile.name.split(' ')[0]}</span>!</h1>
            <p className="text-slate-500 mt-1">Hoje é <span className="font-bold text-slate-700">{getDayOfWeekPT()}</span>. Seus macros estão sincronizados.</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50">Sair</button>
        </header>

        {macros && (
          <Dashboard 
            profile={currentUser.profile} 
            macros={macros} 
            intake={combinedIntake}
            onUpdateWeight={handleUpdateWeight}
            onUpdateIntake={handleUpdateIntake}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <WeeklyLogComponent 
                logs={weeklyLog} 
                onLogChange={(day, val) => setWeeklyLog(prev => ({ ...prev, [day]: val }))} 
                onAnalyze={handleAnalyzeDay} 
                isLoading={isLoading} 
              />
              
              <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                <div className="relative z-10 max-w-md text-center md:text-left">
                  <h4 className="font-bold text-2xl mb-2">Dica Premium</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4 md:mb-0">Ao atualizar o texto do diário e clicar na seta, o sistema recalcula tudo daquele dia. Ideal para ajustes finos!</p>
                </div>
                <button onClick={() => {setIsChatOpen(true); handleSendMessage("Dra, como faço para não esquecer de beber água?");}} className="relative z-10 px-8 py-4 bg-green-600 rounded-2xl font-bold text-sm hover:bg-green-500 transition shadow-lg shadow-green-900/20">Dicas de Hidratação</button>
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 font-black">AI</div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">Mensagem Rápida</h4>
                    <p className="text-[10px] text-green-600 font-bold uppercase">Dra. Nutri Expert</p>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Envie uma dúvida..."
                    onKeyDown={(e) => {
                      if(e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if(val) {
                          handleSendMessage(val);
                          setIsChatOpen(true);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm outline-none focus:ring-2 focus:ring-green-500 transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              <WeightChart history={currentUser.weightHistory || []} />
              
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center text-xs uppercase tracking-widest">💡 Recursos IA</h4>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition" onClick={() => setIsChatOpen(true)}>
                    <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center mr-3">📸</div>
                    <div><p className="text-xs font-bold text-green-800">Analise por Foto</p><p className="text-[10px] text-green-700">Abra o chat para enviar!</p></div>
                  </div>
                </div>
              </div>

              <SuggestionBox onSend={handleSendSuggestion} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
