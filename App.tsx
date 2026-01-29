import React, { useState, useRef, useEffect } from 'react';
import { AppState, ClientScenario, Feedback, FocusArea, Language, ChatMessage } from './types';
import { generateNewScenario, evaluateFullDialogue, getNextClientTurn, transcribeAudio } from './geminiService';
import ScenarioCard from './components/ScenarioCard';
import FeedbackPanel from './components/FeedbackPanel';
import { Brain, Send, Loader2, Mic, Square, Target, ChevronLeft, MessageSquare, ShieldAlert, Heart, ClipboardCheck, Trash2, DoorOpen, Coffee, ArrowRightLeft, Zap, Waves, Flame, Eye, User, Sparkles, HelpCircle } from 'lucide-react';

interface FocusAreaItem {
  id: FocusArea;
  category: 'eft' | 'microskills' | 'process' | 'situational';
  translations: Record<Language, { title: string; desc: string }>;
  icon: React.ReactNode;
}

const FOCUS_AREAS: FocusAreaItem[] = [
  // EFT 专项
  { id: 'EFT - Empathic Validation', category: 'eft', translations: { en: { title: 'Empathic Validation', desc: 'Validating pain logic.' }, zh: { title: '共情验证', desc: '验证痛苦情绪的内在逻辑。' } }, icon: <Heart size={18} className="text-rose-500" /> },
  { id: 'EFT - Evocative Responding', category: 'eft', translations: { en: { title: 'Evocative Responding', desc: 'Bringing feelings to the edge.' }, zh: { title: '启发性回应', desc: '生动描述体验，唤起边缘感受。' } }, icon: <Flame size={18} className="text-orange-500" /> },
  { id: 'EFT - Deepening Emotion', category: 'eft', translations: { en: { title: 'Deepening Emotion', desc: 'Secondary to primary.' }, zh: { title: '情绪深化', desc: '从次生情绪引向核心原生体验。' } }, icon: <Waves size={18} className="text-blue-500" /> },
  { id: 'EFT - Marker Identification', category: 'eft', translations: { en: { title: 'Marker Identification', desc: 'Conflict/unfinished business.' }, zh: { title: '标记识别', desc: '精准识别未竟之事或自我冲突。' } }, icon: <Eye size={18} className="text-purple-500" /> },
  
  // 临床基础 (Microskills)
  { id: 'Emotional Reflection', category: 'microskills', translations: { en: { title: 'Emotional Reflection', desc: 'Identify feelings.' }, zh: { title: '情感反映', desc: '准确识别并回馈情感状态。' } }, icon: <MessageSquare size={18} /> },
  { id: 'Content Reflection', category: 'microskills', translations: { en: { title: 'Content Reflection', desc: 'Paraphrase message.' }, zh: { title: '内容反映', desc: '对咨询内容进行反映与释义。' } }, icon: <ClipboardCheck size={18} /> },
  { id: 'Questioning Skills', category: 'microskills', translations: { en: { title: 'Questioning', desc: 'Open/closed questions.' }, zh: { title: '提问技术', desc: '合理使用提问并取得平衡。' } }, icon: <HelpCircle size={18} /> },
  { id: 'Summarizing', category: 'microskills', translations: { en: { title: 'Summarizing', desc: 'Synthesize sessions.' }, zh: { title: '总结技术', desc: '归纳总结咨询内容与计划。' } }, icon: <Target size={18} /> },

  // 临床过程
  { id: 'Initial Interview', category: 'process', translations: { en: { title: 'Initial Interview', desc: 'Rapport and assessment.' }, zh: { title: '首次会谈', desc: '建立关系、知情同意与评估。' } }, icon: <Coffee size={18} /> },
  { id: 'Referral', category: 'process', translations: { en: { title: 'Referral', desc: 'Transitioning care.' }, zh: { title: '转介处理', desc: '评估匹配、沟通局限与交接。' } }, icon: <ArrowRightLeft size={18} /> },
  { id: 'Termination', category: 'process', translations: { en: { title: 'Termination', desc: 'Closing the relationship.' }, zh: { title: '结案阶段', desc: '巩固成效、处理分离与告别。' } }, icon: <DoorOpen size={18} /> },

  // 特殊情境
  { id: 'Working with Resistance', category: 'situational', translations: { en: { title: 'Managing Resistance', desc: 'Navigate pushback.' }, zh: { title: '处理阻抗', desc: '应对抵触或缺乏投入。' } }, icon: <ShieldAlert size={18} /> },
  { id: 'Crisis Intervention', category: 'situational', translations: { en: { title: 'Crisis Intervention', desc: 'High-risk moments.' }, zh: { title: '危机干预', desc: '管理高风险时刻的应对。' } }, icon: <Zap size={18} /> },
];

const TRANSLATIONS: Record<Language, any> = {
  en: {
    heroTitle: 'MindRefine',
    heroDesc: 'Clinical Dialogue Practice',
    startBtn: 'Start Practice',
    categories: { eft: 'Emotion-Focused', microskills: 'Clinical Basics', process: 'Clinical Process', situational: 'Situational' },
    back: 'Back',
    submit: 'Reply',
    getFeedback: 'Supervise',
    analyzing: 'Supervising...',
    feedbackTitle: 'Clinical Supervision',
    nextScenario: 'Next Case',
    improveResponse: 'Restart Dialogue',
    evaluationResult: 'Overall Competency',
    points: 'pts',
    metrics: { empathy: 'Empathy', reflection: 'Processing', microSkills: 'Technique', professionalism: 'Presence' },
    strengths: 'Clinical Strengths',
    growthAreas: 'Development Needed',
    refinedResponse: 'Supervisor\'s Alternative Trajectory',
    clientIsTyping: 'Client is responding...',
    initialStatement: 'Initial Statement'
  },
  zh: {
    heroTitle: 'MindRefine',
    heroDesc: '临床对话刻意练习系统',
    startBtn: '开始练习',
    categories: { eft: '情绪聚焦 (EFT)', microskills: '临床基础', process: '临床过程', situational: '特殊情境' },
    back: '返回',
    submit: '回应',
    getFeedback: '申请督导',
    analyzing: '督导分析中...',
    feedbackTitle: '临床督导综合反馈',
    nextScenario: '下一题',
    improveResponse: '重新开始对话',
    evaluationResult: '综合评估结果',
    points: '分',
    metrics: { empathy: '共情深度', reflection: '加工水平', microSkills: '临床技术', professionalism: '专业临场感' },
    strengths: '优势表现',
    growthAreas: '改进建议',
    refinedResponse: '督导替代性反应示教',
    clientIsTyping: '来访者正在回应...',
    initialStatement: '来访者陈述'
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [currentScenario, setCurrentScenario] = useState<ClientScenario | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<FocusArea | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClientResponding, setIsClientResponding] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isClientResponding]);

  const startNewPractice = async (focusArea: FocusArea) => {
    setIsLoading(true);
    setSelectedFocus(focusArea);
    try {
      const scenario = await generateNewScenario(focusArea, language);
      setCurrentScenario(scenario);
      setMessages([{ role: 'client', text: scenario.statement, nonVerbal: scenario.nonVerbalCues }]);
      setUserResponse('');
      setFeedback(null);
      setAppState(AppState.PRACTICE);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleReply = async () => {
    if (!userResponse.trim() || !currentScenario) return;
    
    const newHistory = [...messages, { role: 'counselor', text: userResponse } as ChatMessage];
    setMessages(newHistory);
    setUserResponse('');
    setIsClientResponding(true);

    try {
      const clientTurn = await getNextClientTurn(currentScenario, newHistory, language);
      setMessages([...newHistory, { role: 'client', text: clientTurn.text, nonVerbal: clientTurn.nonVerbal }]);
    } catch (e) { console.error(e); }
    finally { setIsClientResponding(false); }
  };

  const handleRequestFeedback = async () => {
    if (messages.length < 2 || !currentScenario) return;
    setIsLoading(true);
    try {
      const res = await evaluateFullDialogue(currentScenario, messages, language);
      setFeedback(res);
      setAppState(AppState.RESULTS);
    } finally { setIsLoading(false); }
  };

  const MobileHeader = ({ title, showBack }: { title: string, showBack?: boolean }) => (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-50 pt-[env(safe-area-inset-top)] shadow-sm">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => setAppState(appState === AppState.RESULTS ? AppState.PRACTICE : AppState.SELECT_FOCUS)} className="p-1 -ml-1 text-slate-500 active:bg-slate-50 rounded-full">
              <ChevronLeft size={24} />
            </button>
          )}
          <span className="font-bold text-lg text-slate-900 truncate max-w-[180px]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {appState === AppState.PRACTICE && messages.length >= 2 && (
            <button onClick={handleRequestFeedback} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full active:scale-95 transition-all flex items-center gap-1">
              <Sparkles size={14} /> {t.getFeedback}
            </button>
          )}
          <button onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')} className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 active:scale-95">
            {language === 'en' ? '中' : 'EN'}
          </button>
        </div>
      </div>
    </div>
  );

  if (appState === AppState.HOME) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="space-y-6 animate-slide-up">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <Brain size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight">{t.heroTitle}</h1>
            <p className="text-indigo-100 font-medium opacity-80">{t.heroDesc}</p>
          </div>
          <button onClick={() => setAppState(AppState.SELECT_FOCUS)} className="w-full max-w-[280px] py-4 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl active:scale-95 transition-transform text-lg">
            {t.startBtn}
          </button>
        </div>
      </div>
    );
  }

  if (appState === AppState.SELECT_FOCUS) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <MobileHeader title={language === 'zh' ? '选择练习' : 'Select Focus'} />
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {['eft', 'microskills', 'process', 'situational'].map(cat => (
            <div key={cat} className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.categories[cat]}</h3>
              <div className="grid grid-cols-2 gap-3">
                {FOCUS_AREAS.filter(f => f.category === cat).map(item => (
                  <button key={item.id} onClick={() => startNewPractice(item.id)} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 text-left flex flex-col gap-3 group">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">{item.icon}</div>
                    <span className="font-bold text-sm text-slate-800 leading-tight">{item.translations[language].title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {isLoading && <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}
      </div>
    );
  }

  if (appState === AppState.PRACTICE) {
    return (
      <div className="min-h-screen bg-white flex flex-col h-screen overflow-hidden">
        <MobileHeader title={selectedFocus ? FOCUS_AREAS.find(f => f.id === selectedFocus)?.translations[language].title : 'Practice'} showBack />
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
          {currentScenario && (
            <div className="mb-6 opacity-60">
               <ScenarioCard scenario={currentScenario} />
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'client' ? 'items-start' : 'items-end'} animate-slide-up`}>
              <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'client' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'client' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                  {msg.role === 'client' ? <User size={16} /> : <Brain size={16} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'client' ? 'bg-indigo-50 text-slate-800 rounded-bl-none' : 'bg-indigo-600 text-white rounded-br-none'}`}>
                  {msg.nonVerbal && <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-1 italic">{msg.nonVerbal}</p>}
                  <p className={msg.role === 'client' ? 'serif italic' : ''}>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isClientResponding && (
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold animate-pulse">
              <Loader2 size={12} className="animate-spin" /> {t.clientIsTyping}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-slate-100">
          <div className="max-w-md mx-auto flex items-end gap-2">
            <textarea 
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder={language === 'zh' ? '请输入您的专业回应...' : 'Your clinical response...'}
              className="flex-1 h-12 max-h-32 p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
            />
            <button 
              onClick={handleReply}
              disabled={isClientResponding || !userResponse.trim()}
              className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.RESULTS && feedback) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <MobileHeader title={t.feedbackTitle} showBack />
        <div className="flex-1 p-4 space-y-6 pb-20 overflow-y-auto">
          {feedback.interactionAnalysis && (
             <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} /> 会话脉络分析
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">{feedback.interactionAnalysis}</p>
            </div>
          )}
          <FeedbackPanel 
            feedback={feedback}
            onRetry={() => { setAppState(AppState.SELECT_FOCUS); setFeedback(null); }}
            onNext={() => startNewPractice(selectedFocus || 'EFT - Empathic Validation')}
            labels={{
              title: t.feedbackTitle,
              metrics: t.metrics,
              strengths: t.strengths,
              growthAreas: t.growthAreas,
              refinedResponse: t.refinedResponse,
              nextScenario: t.nextScenario,
              improveResponse: t.improveResponse,
              evaluationResult: t.evaluationResult,
              points: t.points
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default App;
