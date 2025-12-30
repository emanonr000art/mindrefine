import { GoogleGenAI, Type } from "@google/genai";
import { ClientScenario, Feedback, FocusArea, Language } from "./types";

// Initialize the Google GenAI client using the API key from environment variables as required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SCENARIO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    age: { type: Type.NUMBER },
    background: { type: Type.STRING },
    presentingProblem: { type: Type.STRING },
    nonVerbalCues: { type: Type.STRING },
    statement: { type: Type.STRING },
    theoreticalOrientation: { type: Type.STRING },
  },
  required: ["id", "name", "age", "background", "presentingProblem", "nonVerbalCues", "statement", "theoreticalOrientation"]
};

const FEEDBACK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    growthAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
    competencyAnalysis: {
      type: Type.OBJECT,
      properties: {
        empathy: { type: Type.NUMBER },
        reflectiveListening: { type: Type.NUMBER },
        microSkills: { type: Type.NUMBER },
        professionalism: { type: Type.NUMBER },
      },
      required: ["empathy", "reflectiveListening", "microSkills", "professionalism"]
    },
    revisedResponse: { type: Type.STRING },
    explanation: { type: Type.STRING },
  },
  required: ["score", "strengths", "growthAreas", "competencyAnalysis", "revisedResponse", "explanation"]
};

// 临床胜任力定义
const COMPETENCY_DEFINITIONS: Record<string, string> = {
  'Empathy': "Empathy (共情): Experiencing the client's inner world and communicating understanding.",
  'Emotional Reflection': "Emotional Reflection (情感反映): Accurately identifying and reflecting the client's emotional state.",
  'Content Reflection': "Content Reflection (内容反映): Paraphrasing and restating the client's core message.",
  'Confrontation': "Confrontation (面质): Highlighting inconsistencies in the client's speech or behavior.",
  'Unconditional Positive Regard': "Unconditional Positive Regard (无条件积极关注): Accepting the client as a whole without judgment.",
  'Genuineness': "Genuineness (真诚一致): Being real and authentic without a professional mask.",
  'Self-Awareness': "Self-Awareness (自我觉察): Evaluating one's own motivations and values.",
  'Questioning Skills': "Questioning Skills (提问技术): Balancing open and closed questions.",
  'Summarizing': "Summarizing (总结技术): Synthesizing content, feelings, and future plans.",
  'Crisis Intervention': "Crisis Intervention (危机干预): Identifying and managing acute distress or high-risk situations.",
  'Working with Resistance': "Working with Resistance (处理阻抗): Navigating pushback with empathy.",
  'Initial Interview': "Initial Interview (首次会谈): Establishing rapport, intake assessment, explaining boundaries, and managing first-session anxiety.",
  'Referral': "Referral (转介): Recognizing professional limitations, explaining the need for transition, and managing the client's potential feeling of rejection.",
  'Termination': "Termination (结案阶段): Consolidation of clinical gains, processing separation/loss, and planning for the future.",
  'Case Conceptualization': "Case Conceptualization (个案概念化): Integrating theory and info into a clinical picture.",
};

// 增加个案多样性的维度
const CLINICAL_DIVERSITY_POOL = {
  issues: [
    "Existential dread (existence, death, meaninglessness)",
    "Complicated grief and hidden loss",
    "Complex trauma (C-PTSD) related to attachment",
    "Identity exploration (gender, career, self-worth)",
    "Somatization (physical symptoms without medical cause)",
    "Postnatal emotional struggles / Parenting identity crisis",
    "Elder loneliness and integrity vs. despair",
    "Interpersonal sensitivity and social anxiety",
    "Impulse control and emotional dysregulation",
    "Success neurosis or fear of failure"
  ],
  personalityLevels: [
    "Neurotic Level (High functioning, integrated ego, internal conflicts)",
    "Borderline Personality Traits (Emotional instability, splitting, abandonment fears)",
    "Narcissistic Vulnerability (Fragile self-esteem, defensive grandiosity)",
    "Avoidant/Dependent patterns (Severe interpersonal inhibition)",
    "Obsessive-Compulsive Personality style (Rigidity, intellectualization)"
  ],
  socioContexts: [
    "High-SES professional facing spiritual emptiness",
    "Low-income individual facing systemic oppression and survival stress",
    "Academic high-achiever with 'gifted child' syndrome",
    "Empty-nest elderly person",
    "LGBTQ+ individual navigating social stigma",
    "Artistic personality struggling with creative blocks"
  ]
};

export async function generateNewScenario(focusArea: FocusArea, language: Language): Promise<ClientScenario> {
  const languageName = language === 'zh' ? 'Chinese (Mandarin)' : 'English';
  
  const randomIssue = CLINICAL_DIVERSITY_POOL.issues[Math.floor(Math.random() * CLINICAL_DIVERSITY_POOL.issues.length)];
  const randomLevel = CLINICAL_DIVERSITY_POOL.personalityLevels[Math.floor(Math.random() * CLINICAL_DIVERSITY_POOL.personalityLevels.length)];
  const randomContext = CLINICAL_DIVERSITY_POOL.socioContexts[Math.floor(Math.random() * CLINICAL_DIVERSITY_POOL.socioContexts.length)];

  // Adjust prompt for specific clinical process stages
  let stageModifier = "";
  if (focusArea === 'Initial Interview') stageModifier = "The session is the VERY FIRST meeting. The client might be anxious, guarded, or unsure about the process.";
  if (focusArea === 'Referral') stageModifier = "The counselor has decided they are not the best fit (due to scope of practice) and needs to suggest a referral. The client's statement should reflect a need that is outside the counselor's competence.";
  if (focusArea === 'Termination') stageModifier = "This is the FINAL session. The client might feel loss, gratitude, or anxiety about 'going it alone'.";

  const prompt = `
    TASK: Generate a UNIQUE and DEEP psychological counseling scenario.
    TARGET LANGUAGE: ${languageName}
    STRICT LANGUAGE ENFORCEMENT: ALL content in the JSON must be in ${languageName}.

    CLINICAL DIMENSIONS:
    1. Focus Skill/Stage: ${focusArea} (${COMPETENCY_DEFINITIONS[focusArea] || ''})
    2. Core Issue: ${randomIssue}
    3. Personality Level: ${randomLevel}
    4. Social Context: ${randomContext}
    
    ${stageModifier}

    REQUIREMENTS:
    - BACKGROUND: Provide a "thick" clinical history including family dynamics and psychological defense mechanisms.
    - PRESENTING PROBLEM: A nuanced description of why they are here.
    - NON-VERBAL CUES: Subtle indicators of internal state.
    - STATEMENT: A challenging quote from the client that specifically requires the counselor to use "${focusArea}". 
    - AVOID CLICHÉS.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SCENARIO_SCHEMA,
    }
  });

  const scenario = JSON.parse(response.text || '{}');
  return { ...scenario, focusArea, language };
}

export async function evaluateResponse(
  scenario: ClientScenario,
  userResponse: string,
  language: Language
): Promise<Feedback> {
  const languageName = language === 'zh' ? 'Chinese (Mandarin)' : 'English';
  const focusArea = scenario.focusArea as FocusArea;
  const focusAreaContext = focusArea ? `The focus of this exercise is: ${focusArea}. Definition: ${COMPETENCY_DEFINITIONS[focusArea] || ''}` : "";
  
  const instruction = language === 'zh' 
    ? "STRICTLY output ALL fields in Simplified Chinese. NO ENGLISH ALLOWED in the text content."
    : "STRICTLY output ALL fields in English.";

  const prompt = `
    ACT AS AN EXPERT CLINICAL SUPERVISOR.
    TARGET LANGUAGE: ${languageName}
    ${instruction}

    Evaluate the counselor's response. 
    Client Context: ${scenario.background}
    Skill Focus: ${focusAreaContext}

    CLIENT SAID: "${scenario.statement}"
    COUNSELOR'S RESPONSE: "${userResponse}"

    Evaluation Criteria (Scores 0-100):
    1. Empathy (共情): Depth of emotional understanding.
    2. Reflection (反应): Accuracy of content/feeling reflection.
    3. Micro-skills (微技能): Technical execution (esp. related to ${focusArea}).
    4. Professionalism (专业性): Ethical stance and tone.

    Provide a gold-standard revised response and explanation in ${languageName}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: FEEDBACK_SCHEMA,
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function transcribeAudio(base64Audio: string, mimeType: string, language: Language): Promise<string> {
  const languageName = language === 'zh' ? 'Chinese' : 'English';
  const langPrompt = `Transcription task: Convert the provided ${languageName} audio to text verbatim.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        { text: langPrompt },
      ],
    },
  });
  return response.text?.trim() || "";
}