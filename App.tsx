import React, { useState, useRef, useEffect } from 'react';
import { AppState, ClientScenario, Feedback, FocusArea, Language } from './types';
import { generateNewScenario, evaluateResponse, transcribeAudio } from './geminiService';
import ScenarioCard from './components/ScenarioCard';
import FeedbackPanel from './components/FeedbackPanel';
import { Sparkles, Brain, BookOpen, Send, Loader2, Mic, Square, Target, ChevronLeft, Globe, MessageSquare, ShieldAlert, Heart, ClipboardCheck, Trash2, DoorOpen, Coffee, ArrowRightLeft } from 'lucide-react';

interface FocusAreaItem {
  id: FocusArea;
  category: 'microskills' | 'relationship' | 'process' | 'situational';
  translations: Record<Language, { title: string; desc: string }>;
  icon: React.ReactNode;
}

const FOCUS_AREAS: FocusAreaItem[] = [
  { id: 'Emotional Reflection', category: 'microskills', translations: { en: { title: 'Emotional Reflection', desc: 'Identify underlying feelings.' }, zh: { title: '情感反映', desc: '准确识别并回馈情感状态。' } }, icon: <Heart size={18} /> },
  { id: 'Content Reflection', category: 'microskills', translations: { en: { title: 'Content Reflection', desc: 'Paraphrase core message.' }, zh: { title: '内容反映', desc: '对咨询内容进行反映与释义。' } }, icon: <MessageSquare size={18} /> },
  { id: 'Questioning Skills', category: 'microskills', translations: { en: { title: 'Questioning Skills', desc: 'Open/closed questions.' }, zh: { title: '提问技术', desc: '合理使用提问并取得平衡。' } }, icon: <Target size={18} /> },
  { id: 'Summarizing', category: 'microskills', translations: { en: { title: 'Summarizing', desc: 'Synthesize milestones.' }, zh: { title: '总结技术', desc: '归纳总结咨询内容与计划。' } }, icon: <ClipboardCheck size={18} /> },
  
  { id: 'Empathy', category: 'relationship', translations: { en: { title: 'Empathy', desc: 'Communicating understanding.' }, zh: { title: '共情能力', desc: '深入体验内心世界并反馈。' } }, icon: <Brain size={18} /> },
  { id: 'Genuineness', category: 'relationship', translations: { en: { title: 'Genuineness', desc: 'Be yourself without masks.' }, zh: { title: '真诚一致', desc: '真实可信，表里如一。' } }, icon: <Brain size={18} /> },
  
  { id: 'Initial Interview', category: 'process', translations: { en: { title: 'Initial Interview', desc: 'Rapport and assessment.' }, zh: { title: '首次会谈', desc: '建立关系、知情同意与评估。' } }, icon: <Coffee size={18} /> },
  { id: 'Referral', category: 'process', translations: { en: { title: 'Referral', desc: 'Professional transition.' }, zh: { title: '转介处理', desc: '评估匹配、沟通局限与交接。' } }, icon: <ArrowRightLeft size={18} /> },
  { id: 'Termination', category: 'process', translations: { en: { title: 'Termination', desc: 'Consolidation and ending.' }, zh: { title: '结案阶段', desc: '巩固成效、处理分离与告别。' } }, icon: <DoorOpen size={18} /> },

  { id: 'Working with Resistance', category: 'situational', translations: { en: { title: 'Managing Resistance', desc: 'Navigate pushback.' }, zh: { title: '处理阻抗', desc: '应对抵触或缺乏投入。' } }, icon: <ShieldAlert size={18} /> },
  { id: 'Crisis Intervention', category: 'situational', translations: { en: { title: 'Crisis Intervention', desc: 'Handle high-risk moments.' }, zh: { title: '危机干预', desc: '管理高风险时刻的应对。' } }, icon: <ShieldAlert size={18} /> },
];

const TRANSLATIONS: Record<Language, any> = {
  en: {
    heroTitle: 'MindRefine',
    heroDesc: 'Professional Counseling Deliberate Practice',
    startBtn: 'Start Practice',
    categories: { microskills: 'Microskills', relationship: 'Relationship', process: 'Clinical Process', situational: 'Situational' },
    back: 'Back',
    sessions: 'Sessions',
    focusOn: 'Focus:',
    placeholder: 'Speak or type your clinical response...',
    recording: 'Listening...',
    transcribing: 'Transcribing...',
    submit: 'Submit',
    analyzing: 'Evaluating...',
    feedbackTitle: 'Supervisory Feedback',
    nextScenario: 'Next',
    improveResponse: 'Try Again',
    evaluationResult: 'Evaluation Result',
    points: 'pts',
    metrics: {
      empathy: 'Empathy',
      reflection: 'Reflection',
      microSkills: 'Micro-Skills',
      professionalism: 'Professionalism'
    },
    strengths: 'Strengths',
    growthAreas: 'Growth Areas',
    refinedResponse: 'Supervisory Demo'
  },
  zh: {
    heroTitle: 'MindRefine',
    heroDesc: '心理咨询师临床刻意练习',
    startBtn: '开始练习',
    categories: { microskills: '临床微技能', relationship: '咨访关系', process: '临床过程', situational: '特殊情境' },
    back: '返回',
    sessions: '练习',
    focusOn: '重点:',
    placeholder: '点击麦克风录音或输入回应...',
    recording: '正在倾听...',
    transcribing: '语音识别中...',
    submit: '提交',
    analyzing: '督导分析中...',
    feedbackTitle: '临床督导反馈',
    nextScenario: '下一题',
    improveResponse: '重新回应',
    evaluationResult: '评估结果',
    points: '分',
    metrics: {
      empathy: '共情理解',
      reflection: '反应技术',
      microSkills: '临床微技能',
      professionalism: '专业表现'
    },
    strengths: '优势表现',
    growthAreas: '改进建议',
    refinedResponse: '专家示教'
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [currentScenario, setCurrentScenario] = useState<ClientScenario | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<FocusArea | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startNewPractice = async (focusArea: FocusArea) => {
    setIsLoading(true);
    setSelectedFocus(focusArea);
    try {
      const scenario = await generateNewScenario(focusArea, language);
      setCurrentScenario(scenario);
      setUserResponse('');
      setFeedback(null);
      setAppState(AppState.PRACTICE);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

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
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          if (blob.size > 1000) handleTranscribe(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (e) { alert("Mic error: " + e); }
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
      } finally { setIsTranscribing(false); }
    };
  };

  const handleSubmit = async () => {
    if (!currentScenario || !userResponse.trim()) return;
    setIsLoading(true);
    try {
      const res = await evaluateResponse(currentScenario, userResponse, language);
      setFeedback(res);
      setAppState(AppState.RESULTS);
    } finally { setIsLoading(false); }
  };

  const MobileHeader = ({ title, showBack }: { title: string, showBack?: boolean }) => (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => setAppState(appState === AppState.RESULTS ? AppState.PRACTICE : AppState.SELECT_FOCUS)} className="p-1 -ml-1 text-slate-500">
              <ChevronLeft size={24} />
            </button>
          )}
          <span className="font-bold text-lg text-slate-900">{title}</span>
        </div>
        <button 
          onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
          className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 active:scale-95 transition-transform"
        >
          {language === 'en' ? '中文' : 'EN'}
        </button>
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
          <button 
            onClick={() => setAppState(AppState.SELECT_FOCUS)}
            className="w-full max-w-[280px] py-4 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl active:scale-95 transition-transform text-lg"
          >
            {t.startBtn}
          </button>
        </div>
      </div>
    );
  }

  if (appState === AppState.SELECT_FOCUS) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <MobileHeader title={language === 'zh' ? '选择练习' : 'Select Practice'} />
        <div className="flex-1 p-4 space-y-6 pb-20 overflow-y-auto">
          {['microskills', 'relationship', 'process', 'situational'].map(cat => (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{t.categories[cat]}</h3>
              <div className="grid grid-cols-2 gap-3">
                {FOCUS_AREAS.filter(f => f.category === cat).map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => startNewPractice(item.id)}
                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-colors text-left flex flex-col gap-2"
                  >
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">{item.icon}</div>
                    <span className="font-bold text-sm text-slate-800 leading-tight">{item.translations[language].title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <span className="font-bold text-slate-500">Preparing...</span>
          </div>
        )}
      </div>
    );
  }

  if (appState === AppState.PRACTICE) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <MobileHeader title={selectedFocus ? FOCUS_AREAS.find(f => f.id === selectedFocus)?.translations[language].title : 'Practice'} showBack />
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-32">
          {currentScenario && <ScenarioCard scenario={currentScenario} />}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              <span>{language === 'zh' ? '回应区' : 'Response Area'}</span>
              {(isRecording || isTranscribing) && <span className="text-indigo-600 animate-pulse">{isRecording ? t.recording : t.transcribing}</span>}
            </div>
            <textarea 
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder={t.placeholder}
              className="w-full h-40 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 leading-relaxed"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 pb-safe">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button 
              onClick={() => setUserResponse('')}
              className="p-4 bg-slate-50 text-slate-400 rounded-2xl active:bg-slate-100"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all shadow-lg ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isLoading || !userResponse.trim()}
              className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {isLoading ? t.analyzing : t.submit}
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
          <FeedbackPanel 
            feedback={feedback}
            onRetry={() => { setAppState(AppState.PRACTICE); setFeedback(null); }}
            onNext={() => startNewPractice(selectedFocus || 'Empathy')}
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