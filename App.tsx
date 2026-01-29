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
    generatingMaterials: 'Generating Case...',
    title: 'Clinical Supervision',
    nextScenario: 'Next Case',
    improveResponse: 'Restart Dialogue',
    evaluationResult: 'Overall Competency',
    points: 'pts',
    metrics: { empathy: 'Empathy', reflection: 'Processing', microSkills: 'Technique', professionalism: 'Presence' },
    strengths: 'Clinical Strengths',
    growthAreas: 'Development Needed',
    refinedResponse: 'Supervisor\'s Alternative Trajectory',
    clientIsTyping: 'Client is responding...',
    initialStatement: 'Initial Statement',
    recording: 'Listening...',
    transcribing: 'Transcribing...',
    selectFocusTitle: 'Select Focus Area',
    homeTagline: 'Combine clinical supervision with AI scenarios for deep deliberate practice.',
    inputPlaceholder: 'Enter your response...',
    transcribingLabel: 'Transcribing...',
    languageButton: '中文'
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
    generatingMaterials: '材料生成中...',
    title: '临床督导综合反馈',
    nextScenario: '下一题',
    improveResponse: '重新开始对话',
    evaluationResult: '综合评估结果',
    points: '分',
    metrics: { empathy: '共情深度', reflection: '加工水平', microSkills: '临床技术', professionalism: '专业临场感' },
    strengths: '优势表现',
    growthAreas: '改进建议',
    refinedResponse: '督导替代性反应示教',
    clientIsTyping: '来访者正在回应...',
    initialStatement: '来访者陈述',
    recording: '正在倾听...',
    transcribing: '语音识别中...',
    selectFocusTitle: '选择练习方向',
    homeTagline: '结合临床督导思维与 AI 个案模拟，为您提供深度的临床对话刻意练习。',
    inputPlaceholder: '输入你的回应...',
    transcribingLabel: '语音识别中...',
    languageButton: 'English'
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
  const [loadingText, setLoadingText] = useState('');
  const [isClientResponding, setIsClientResponding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isClientResponding]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          if (blob.size > 1000) handleTranscribe(blob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Mic access error:", e);
        alert(language === 'zh' ? '麦克风权限被拒绝或不可用。' : 'Microphone access denied or unavailable.');
      }
    }
  };

  const handleTranscribe = async (blob: Blob) => {
    setIsTranscribing(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const text = await transcribeAudio(base64, blob.type, language);
        if (text) setUserResponse(prev => (prev ? prev + ' ' : '') + text);
      } catch (e) {
        console.error("Transcription error:", e);
      } finally {
        setIsTranscribing(false);
      }
    };
  };

  const handleStartPractice = async (focus: FocusArea) => {
    setSelectedFocus(focus);
    setLoadingText(t.generatingMaterials);
    setIsLoading(true);
    try {
      const scenario = await generateNewScenario(focus, language);
      setCurrentScenario(scenario);
      setMessages([{ role: 'client', text: scenario.statement, nonVerbal: scenario.nonVerbalCues }]);
      setAppState(AppState.PRACTICE);
    } catch (e) {
      console.error("Failed to generate scenario:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userResponse.trim() || !currentScenario || isClientResponding) return;
    
    const clientTurn: ChatMessage = { role: 'counselor', text: userResponse };
    const newMessages = [...messages, clientTurn];
    setMessages(newMessages);
    setUserResponse('');
    setIsClientResponding(true);

    try {
      const response = await getNextClientTurn(currentScenario, newMessages, language);
      setMessages([...newMessages, { role: 'client', text: response.text, nonVerbal: response.nonVerbal }]);
    } catch (e) {
      console.error("Failed to get client turn:", e);
    } finally {
      setIsClientResponding(false);
    }
  };

  const handleGetFeedback = async () => {
    if (!currentScenario || messages.length < 2) return;
    setLoadingText(t.analyzing);
    setIsLoading(true);
    try {
      const result = await evaluateFullDialogue(currentScenario, messages, language);
      setFeedback(result);
      setAppState(AppState.RESULTS);
    } catch (e) {
      console.error("Supervision error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPractice = () => {
    setMessages([]);
    setFeedback(null);
    setAppState(AppState.SELECT_FOCUS);
  };

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <Brain size={20} />
          </div>
          <h1 className="font-black text-xl tracking-tight text-slate-800">{t.heroTitle}</h1>
        </div>
        <button 
          onClick={handleToggleLanguage}
          className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          {t.languageButton}
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-28">
        {appState === AppState.HOME && (
          <div className="py-12 text-center space-y-6 animate-fade-in">
            <div className="inline-flex p-6 bg-indigo-50 rounded-3xl text-indigo-600 mb-4">
              <Sparkles size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 leading-tight tracking-tight">{t.heroDesc}</h2>
            <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
              {t.homeTagline}
            </p>
            <button 
              onClick={() => setAppState(AppState.SELECT_FOCUS)}
              className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
            >
              {t.startBtn}
              <ArrowRightLeft size={20} />
            </button>
          </div>
        )}

        {appState === AppState.SELECT_FOCUS && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setAppState(AppState.HOME)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                <ChevronLeft size={24} />
              </button>
              <h3 className="text-lg font-bold text-slate-800">{t.selectFocusTitle}</h3>
              <div className="w-10" />
            </div>

            {['eft', 'microskills', 'process', 'situational'].map(cat => (
              <div key={cat} className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {t.categories[cat as keyof typeof t.categories]}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {FOCUS_AREAS.filter(f => f.category === cat).map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleStartPractice(f.id)}
                      disabled={isLoading}
                      className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-left flex items-center gap-4 disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0">
                        {f.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 truncate">{f.translations[language].title}</div>
                        <div className="text-xs text-slate-400 truncate">{f.translations[language].desc}</div>
                      </div>
                      {isLoading && selectedFocus === f.id ? <Loader2 size={18} className="animate-spin text-indigo-600" /> : <ChevronLeft size={18} className="rotate-180 text-slate-300" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {appState === AppState.PRACTICE && currentScenario && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setAppState(AppState.SELECT_FOCUS)} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600">
                <ChevronLeft size={18} /> {t.back}
              </button>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-wider">
                {selectedFocus}
              </div>
            </div>

            <ScenarioCard scenario={currentScenario} />

            <div className="space-y-4 pt-2" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'counselor' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    m.role === 'counselor' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'
                  }`}>
                    {m.role === 'client' && m.nonVerbal && (
                      <div className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mb-1">
                        [{m.nonVerbal}]
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              {isClientResponding && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{t.clientIsTyping}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-50/80 backdrop-blur-md border-t border-slate-200">
              <div className="max-w-2xl mx-auto flex gap-2">
                <button
                  onClick={toggleRecording}
                  disabled={isClientResponding || isTranscribing}
                  className={`p-4 rounded-2xl flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-100' 
                      : 'bg-white text-slate-400 border border-slate-200 active:bg-slate-50'
                  }`}
                >
                  {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
                </button>
                <div className="relative flex-1">
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder={isTranscribing ? t.transcribingLabel : t.inputPlaceholder}
                    disabled={isClientResponding || isTranscribing}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none min-h-[52px] max-h-32 shadow-sm"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!userResponse.trim() || isClientResponding || isTranscribing}
                    className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm shadow-indigo-100"
                  >
                    <Send size={18} />
                  </button>
                </div>
                {messages.length >= 2 && !isClientResponding && (
                  <button
                    onClick={handleGetFeedback}
                    className="p-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                    title={t.getFeedback}
                  >
                    <Zap size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {appState === AppState.RESULTS && feedback && (
          <FeedbackPanel 
            feedback={feedback} 
            onRetry={resetPractice} 
            onNext={() => { setAppState(AppState.SELECT_FOCUS); setFeedback(null); }} 
            labels={t}
          />
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-100 rounded-full" />
                <div className="absolute top-0 w-12 h-12 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
              </div>
              <p className="font-bold text-slate-800">{loadingText}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
