import React from 'react';
import { Feedback } from '../types';
import { CheckCircle2, AlertCircle, Award, Lightbulb, ChevronRight } from 'lucide-react';

interface FeedbackPanelProps {
  feedback: Feedback;
  onRetry: () => void;
  onNext: () => void;
  labels: {
    title: string;
    metrics: { empathy: string; reflection: string; microSkills: string; professionalism: string };
    strengths: string;
    growthAreas: string;
    refinedResponse: string;
    nextScenario: string;
    improveResponse: string;
    evaluationResult: string;
    points: string;
  };
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ feedback, onRetry, onNext, labels }) => {
  // Defensive checks to prevent "Cannot read properties of undefined"
  const safeMetrics = feedback.competencyAnalysis || {
    empathy: 0,
    reflectiveListening: 0,
    microSkills: 0,
    professionalism: 0
  };

  const safeLabels = labels.metrics || {
    empathy: 'Empathy',
    reflection: 'Reflection',
    microSkills: 'Micro-Skills',
    professionalism: 'Professionalism'
  };

  const metrics = [
    { label: safeLabels.empathy, value: safeMetrics.empathy, color: 'bg-rose-500' },
    { label: safeLabels.reflection, value: safeMetrics.reflectiveListening, color: 'bg-indigo-500' },
    { label: safeLabels.microSkills, value: safeMetrics.microSkills, color: 'bg-amber-500' },
    { label: safeLabels.professionalism, value: safeMetrics.professionalism, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="text-amber-500" size={28} />
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{labels.title}</h3>
            <p className="text-xs text-slate-400 font-medium">{labels.evaluationResult}</p>
          </div>
        </div>
        <div className="text-2xl font-black text-indigo-600 tabular-nums">
          {feedback.score}<span className="text-xs text-slate-300 ml-1">{labels.points}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">
              <span>{m.label}</span>
              <span className="text-slate-600">{m.value}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
              <div 
                className={`h-full ${m.color} transition-all duration-1000`} 
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-6 text-white space-y-4 shadow-xl shadow-indigo-100">
        <div className="flex items-center gap-2">
          <Lightbulb size={20} className="text-indigo-200" />
          <h4 className="font-bold text-sm tracking-wide">{labels.refinedResponse}</h4>
        </div>
        <p className="serif text-lg leading-relaxed italic opacity-95">"{feedback.revisedResponse || '...'}"</p>
        <p className="text-xs text-indigo-100/70 border-t border-white/10 pt-3 leading-relaxed">
          {feedback.explanation || ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            {labels.strengths}
          </h4>
          <div className="space-y-2">
            {(feedback.strengths || []).slice(0, 3).map((s, i) => (
              <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 bg-emerald-500 rounded-full shrink-0" />
                {s}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            {labels.growthAreas}
          </h4>
          <div className="space-y-2">
            {(feedback.growthAreas || []).slice(0, 3).map((g, i) => (
              <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 bg-amber-500 rounded-full shrink-0" />
                {g}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2 pb-safe">
        <button 
          onClick={onRetry}
          className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 active:bg-slate-50 transition-colors"
        >
          {labels.improveResponse}
        </button>
        <button 
          onClick={onNext}
          className="flex-[1.5] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {labels.nextScenario}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default FeedbackPanel;