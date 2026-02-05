
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
import { syncUserToCloud, auth, db } from './services/firebaseService';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<NutritionChatSession | null>(null);
  const [pendingMacros, setPendingMacros] = useState<{data: DailyIntake, day: DayOfWeek} | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const getDayOfWeekPT = () => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[new Date().getDay()] as DayOfWeek;
  };

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayOfWeekPT());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as AuthUser;
          setCurrentUser(userData);
          if (userData.profile) setChatSession(new NutritionChatSession(userData.profile));
        } else {
          const newUser = { id: firebaseUser.uid, email: firebaseUser.email!, name: firebaseUser.displayName || 'Usuário' };
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
        setChatSession(null);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const mealLogs = useMemo(() => {
    return currentUser?.mealLogs || {
      Segunda: '', Terça: '', Quarta: '', Quinta: '', Sexta: '', Sábado: '', Domingo: ''
    };
  }, [currentUser]);

  const macros = useMemo(() => {
    return currentUser?.profile ? calculateMacros(currentUser.profile) : null;
  }, [currentUser]);

  const combinedIntake = useMemo(() => {
    if (!currentUser) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const manual = currentUser.manualIntake?.[selectedDay] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const log = currentUser.logMacros?.[selectedDay] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return {
      calories: (manual.calories || 0) + (log.calories || 0),
      protein: (manual.protein || 0) + (log.protein || 0),
      carbs: (manual.carbs || 0) + (log.carbs || 0),
      fats: (manual.fats || 0) + (log.fats || 0),
    };
  }, [currentUser, selectedDay]);

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.profile) setChatSession(new NutritionChatSession(user.profile));
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setChatSession(null);
    setMessages([]);
  };

  const saveUserData = (updates: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    syncUserToCloud(updatedUser);
  };

  const handleLogChange = (day: DayOfWeek, value: string) => {
    if (!currentUser) return;
    const updatedLogs = { ...(currentUser.mealLogs || {}), [day]: value };
    saveUserData({ mealLogs: updatedLogs });
  };

  const handleAnalyzeDay = async (day: DayOfWeek) => {
    const currentText = currentUser?.mealLogs?.[day] || '';
    if (!chatSession || !currentText.trim()) return;
    setIsLoading(true);
    setSelectedDay(day);
    handleSendMessage(`Dra, analise o que comi na ${day}: ${currentText}`);
    const extractedMacros = await chatSession.analyzeNutritionalContent(currentText);
    if (extractedMacros) {
      setPendingMacros({ data: extractedMacros, day });
    } else {
      setMessages(prev => [...prev, { role: 'model', text: "Não consegui identificar alimentos no seu texto." }]);
    }
    setIsLoading(false);
  };

  const confirmPendingMacros = () => {
    if (!pendingMacros || !currentUser) return;
    const { data, day } = pendingMacros;
    const currentLogMacros = currentUser.logMacros || {};
    const updatedLogMacros = { ...currentLogMacros, [day]: data };
    saveUserData({ logMacros: updatedLogMacros });
    setSelectedDay(day);
    setMessages(prev => [...prev, { role: 'model', text: `✅ **Análise salva na nuvem!** Seus macros foram sincronizados.` }]);
    setPendingMacros(null);
    setIsChatOpen(true);
  };

  const handleUpdateIntake = (type: keyof DailyIntake, value: number) => {
    if (!currentUser) return;
    const dayManuals = currentUser.manualIntake || {};
    const currentDayIntake = dayManuals[selectedDay] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const updatedDayIntake = { ...currentDayIntake, [type]: Math.max(0, currentDayIntake[type] + value) };
    const updatedManualIntake = { ...dayManuals, [selectedDay]: updatedDayIntake };
    saveUserData({ manualIntake: updatedManualIntake });
  };

  const handleUpdateWeight = (newWeight: number) => {
    if (!currentUser || !currentUser.profile) return;
    const newEntry: WeightEntry = { date: new Date().toISOString(), weight: newWeight };
    const history = currentUser.weightHistory || [];
    const updatedHistory = [...history, newEntry];
    const updatedProfile = { ...currentUser.profile, weight: newWeight };
    saveUserData({ profile: updatedProfile, weightHistory: updatedHistory });
    handleSendMessage(`Dra, agora estou com **${newWeight}kg**.`);
  };

  const handleProfileSubmit = (newProfile: UserProfile) => {
    if (!currentUser) return;
    saveUserData({ 
      profile: newProfile, 
      weightHistory: [{ date: new Date().toISOString(), weight: newProfile.weight }], 
      manualIntake: {},
      logMacros: {},
      mealLogs: {}
    });
    setChatSession(new NutritionChatSession(newProfile));
  };

  const handleSendMessage = async (text: string, image?: string) => {
    if (!chatSession) return;
    setMessages(prev => [...prev, { role: 'user', text, image }]);
    setIsLoading(true);
    const response = await chatSession.sendMessage(text, image);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  const handleSendSuggestion = async (msg: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "suggestions"), {
        userId: currentUser.id,
        userName: currentUser.name,
        message: msg,
        date: new Date().toLocaleString('pt-BR')
      });
    } catch (e) {
      console.error("Erro ao enviar sugestão:", e);
    }
  };

  if (isInitializing) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="w-12 h-12 border-4 border-green-600/20 border-t-green-600 rounded-full animate-spin mb-4"></div>
    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Conectando ao Firebase...</p>
  </div>;

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  if (currentUser.isAdmin) return <AdminDashboard onLogout={handleLogout} />;
  if (!currentUser.profile) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4"><ProfileForm onSubmit={handleProfileSubmit} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800 font-sans relative pb-24">
      {pendingMacros && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[40px] sm:rounded-3xl shadow-2xl max-w-md w-full p-8 border border-green-100 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-green-100 rounded-2xl text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Confirmar Análise</h3>
                <p className="text-sm text-slate-500">Gravando no Firebase para {pendingMacros.day}.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {['calories', 'protein', 'carbs', 'fats'].map((type) => (
                <div key={type} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{type === 'calories' ? '⚡ Kcal' : type === 'protein' ? '🍗 Prot' : type === 'carbs' ? '🍞 Carb' : '🥑 Gord'}</label>
                  <input type="number" value={Math.round((pendingMacros.data as any)[type] || 0)} onChange={(e) => setPendingMacros({...pendingMacros, data: {...pendingMacros.data, [type]: parseFloat(e.target.value) || 0}})} className="w-full bg-transparent font-black text-xl text-slate-800 outline-none" />
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button onClick={() => setPendingMacros(null)} className="flex-1 py-4 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={confirmPendingMacros} className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl shadow-green-200 transition active:scale-95">Salvar na Nuvem</button>
            </div>
          </div>
        </div>
      )}
      <div className={`fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 z-50 transition-all duration-500 transform ${isChatOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full sm:translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="w-full sm:w-[380px] h-[80vh] sm:h-[600px] shadow-2xl relative sm:rounded-3xl overflow-hidden border-t sm:border border-slate-200">
          <button onClick={() => setIsChatOpen(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md z-[60] transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
          <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
      {!isChatOpen && (
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition transform hover:scale-110 active:scale-95 z-40 flex items-center space-x-2 border-4 border-white"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg><span className="text-sm font-black pr-2 hidden sm:inline uppercase tracking-tighter">Dra. Nutri</span></button>
      )}
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Olá, <span className="text-green-600">{currentUser.name.split(' ')[0]}</span>!</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>Conectado à Nuvem</p>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-200 hover:text-red-500 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
        </header>
        {macros && (
          <Dashboard profile={currentUser.profile!} macros={macros} intake={combinedIntake} selectedDay={selectedDay} onDayChange={(day) => setSelectedDay(day)} onUpdateWeight={handleUpdateWeight} onUpdateIntake={handleUpdateIntake} />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <WeeklyLogComponent logs={mealLogs as WeeklyLog} savedMacros={currentUser.logMacros} onLogChange={handleLogChange} onAnalyze={handleAnalyzeDay} isLoading={isLoading} />
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                <div className="relative z-10 max-w-md text-center md:text-left">
                  <h4 className="font-black text-2xl mb-2 tracking-tight">Sincronização Ativa ☁️</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">"Tudo o que você registra aqui é salvo instantaneamente na sua conta meunutri-e01f2."</p>
                  <button onClick={() => {setIsChatOpen(true); handleSendMessage("Dra, como funciona o salvamento na nuvem?");}} className="px-8 py-4 bg-green-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition shadow-xl shadow-green-900/20">Saiba Mais</button>
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
