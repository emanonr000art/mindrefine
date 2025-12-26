import React from 'react';
import { ClientScenario } from '../types';
import { User, MessageCircle, Info, Activity } from 'lucide-react';

interface ScenarioCardProps {
  scenario: ClientScenario;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario }) => {
  const isZh = scenario.language === 'zh';
  const labels = {
    problem: isZh ? '主诉' : 'Issue',
    background: isZh ? '背景' : 'History',
    nonVerbal: isZh ? '状态' : 'Cues',
    yearsOld: isZh ? '岁' : 'y/o'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <User size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 truncate">{scenario.name}, {scenario.age}{labels.yearsOld}</h2>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">{labels.problem}: {scenario.presentingProblem}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Info size={14} className="text-slate-400 mt-1 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">{scenario.background}</p>
          </div>
          <div className="flex gap-3">
            <Activity size={14} className="text-slate-400 mt-1 shrink-0" />
            <p className="text-xs text-slate-500 italic leading-relaxed">{scenario.nonVerbalCues}</p>
          </div>
        </div>

        <div className="relative mt-2 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
          <MessageCircle size={24} className="absolute -top-3 -left-2 text-indigo-400 bg-white rounded-full p-1 border border-indigo-100" />
          <p className="serif text-lg text-slate-800 leading-snug italic">
            "{scenario.statement}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScenarioCard;