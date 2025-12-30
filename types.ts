export type Language = 'en' | 'zh';

export interface ClientScenario {
  id: string;
  name: string;
  age: number;
  background: string;
  presentingProblem: string;
  nonVerbalCues: string;
  statement: string;
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
  revisedResponse: string;
  explanation: string;
}

export type FocusArea = 
  // 咨询技术 (Microskills)
  | 'Emotional Reflection' 
  | 'Content Reflection' 
  | 'Questioning Skills' 
  | 'Summarizing' 
  | 'Confrontation'
  // 胜任力与特质 (Relationship & Traits)
  | 'Empathy' 
  | 'Unconditional Positive Regard' 
  | 'Genuineness' 
  | 'Self-Awareness'
  // 临床过程 (Clinical Process)
  | 'Initial Interview'
  | 'Referral'
  | 'Termination'
  // 干预与动机 (Advanced/Situational)
  | 'Working with Resistance'
  | 'Crisis Intervention'
  | 'Case Conceptualization'
  | 'Goal Setting';

export enum AppState {
  HOME = 'HOME',
  SELECT_FOCUS = 'SELECT_FOCUS',
  PRACTICE = 'PRACTICE',
  RESULTS = 'RESULTS'
}