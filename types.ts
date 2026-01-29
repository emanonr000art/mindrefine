export type Language = 'en' | 'zh';

export interface ChatMessage {
  role: 'client' | 'counselor';
  text: string;
  nonVerbal?: string;
}

export interface ClientScenario {
  id: string;
  name: string;
  age: number;
  background: string;
  presentingProblem: string;
  nonVerbalCues: string;
  statement: string; // 初始陈述
  theoreticalOrientation: string;
  focusArea?: string;
  language?: Language;
}

export interface Feedback {
  score: number;
  strengths: string[];
  growthAreas: string[];
  competencyAnalysis: {
    empathy: number;
    reflectiveListening: number;
    microSkills: number;
    professionalism: number;
  };
  revisedResponse: string; // 专家示教（针对最后一轮或整体轨迹）
  explanation: string;
  interactionAnalysis?: string; // 会话脉络分析
}

export type FocusArea = 
  // 情绪聚焦疗法 (EFT Focus)
  | 'EFT - Empathic Validation'
  | 'EFT - Evocative Responding'
  | 'EFT - Deepening Emotion'
  | 'EFT - Marker Identification'
  // 临床基础 (Microskills)
  | 'Emotional Reflection' 
  | 'Content Reflection'
  | 'Questioning Skills'
  | 'Summarizing'
  // 临床过程 (Clinical Process)
  | 'Initial Interview'
  | 'Referral'
  | 'Termination'
  // 特殊情境 (Situational)
  | 'Working with Resistance'
  | 'Crisis Intervention'
  | 'Case Conceptualization'
  | 'Empathy';

export enum AppState {
  HOME = 'HOME',
  SELECT_FOCUS = 'SELECT_FOCUS',
  PRACTICE = 'PRACTICE',
  RESULTS = 'RESULTS'
}
