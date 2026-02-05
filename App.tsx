
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
    
    handleSendMessage(`Dra, analise o que comi na ${day}: ${mealText}`);
    
    const extractedMacros = await chatSession.analyzeNutritionalContent(mealText);
    if (extractedMacros) {
      setPendingMacros({ data: extractedMacros, day });
    } else {
      setMessages(prev => [...prev, { role: 'model', text: "Não consegui identificar alimentos no seu texto. Tente descrever melhor o que você comeu!" }]);
    }
    setIsLoading(false);
  };

  const confirmPendingMacros = () => {
    if (!pendingMacros || !currentUser) return;
    
    const { data, day } = pendingMacros;
    const currentLogs = currentUser.logMacros || {};
    
    const updatedLogs = {
      ...currentLogs,
      [day]: data
    };

    saveUserData({ logMacros: updatedLogs });
    
    const successMsg: Message = { 
      role: 'model', 
      text: `✅ **Análise de ${day} concluída!**<br/>Macros sincronizados. Você pode ver o resumo direto no card do diário ou no Dashboard se for o dia de hoje.` 
    };
    setMessages(prev => [...prev, successMsg]);
    setPendingMacros(null);
    
    // Abrir o chat para mostrar o feedback da Dra.
    setIsChatOpen(true);
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[40px] sm:rounded-3xl shadow-2xl max-w-md w-full p-8 border border-green-100 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-green-100 rounded-2xl text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Análise de {pendingMacros.day}</h3>
                <p className="text-sm text-slate-500">Confirme os macros calculados pela IA.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {['calories', 'protein', 'carbs', 'fats'].map((type) => (
                <div key={type} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {type === 'calories' ? '⚡ Kcal' : type === 'protein' ? '🍗 Prot' : type === 'carbs' ? '🍞 Carb' : '🥑 Gord'}
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

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button onClick={() => setPendingMacros(null)} className="flex-1 py-4 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition">Descartar</button>
              <button onClick={confirmPendingMacros} className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl shadow-green-200 transition active:scale-95">Salvar Diário</button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT FLUTUANTE */}
      <div className={`fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 z-50 transition-all duration-500 transform ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full sm:w-[380px] h-[80vh] sm:h-[600px] shadow-2xl relative sm:rounded-3xl overflow-hidden border-t sm:border border-slate-200">
          <button onClick={() => setIsChatOpen(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md z-[60] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition transform hover:scale-110 active:scale-95 z-40 flex items-center space-x-2 border-4 border-white"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span className="text-sm font-black pr-2 hidden sm:inline uppercase tracking-tighter">Dra. Nutri</span>
        </button>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Olá, <span className="text-green-600">{currentUser.profile.name.split(' ')[0]}</span>!</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Status: {getDayOfWeekPT()}</p>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-200 hover:text-red-500 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
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
                savedMacros={currentUser.logMacros}
                onLogChange={(day, val) => setWeeklyLog(prev => ({ ...prev, [day]: val }))} 
                onAnalyze={handleAnalyzeDay} 
                isLoading={isLoading} 
              />
              
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                <div className="relative z-10 max-w-md text-center md:text-left">
                  <h4 className="font-black text-2xl mb-2 tracking-tight">Dica da Nutri 💎</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">"Analisar o diário permite que eu entenda o contexto da sua refeição, não apenas os números. É assim que ajustamos seu metabolismo!"</p>
                  <button onClick={() => {setIsChatOpen(true); handleSendMessage("Dra, como posso melhorar minha saciedade hoje?");}} className="px-8 py-4 bg-green-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition shadow-xl shadow-green-900/20">Ajustar meu Plano</button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-600/20 rounded-full blur-[100px]"></div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <WeightChart history={currentUser.weightHistory || []} />
              <SuggestionBox onSend={handleSendSuggestion} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
