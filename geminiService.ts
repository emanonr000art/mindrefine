
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
      }
    },
    revisedResponse: { type: Type.STRING },
    explanation: { type: Type.STRING },
  },
  required: ["score", "strengths", "growthAreas", "competencyAnalysis", "revisedResponse", "explanation"]
};

const COMPETENCY_DEFINITIONS: Record<string, string> = {
  'Empathy': "Empathy (共情): Experiencing the client's inner world, understanding the link between experience and personality, and communicating this back. (体验别人内心世界、把握经历与人格联系、传达反馈)",
  'Emotional Reflection': "Emotional Reflection (情感反映): Accurately identifying and reflecting the client's emotional state to help them feel understood and validated. (对来访者状况进行评估并反馈情绪)",
  'Content Reflection': "Content Reflection (内容反映): Paraphrasing and restating the client's core message to ensure mutual understanding. (对咨询内容进行反映、复述以及释义)",
  'Confrontation': "Confrontation (面质): Highlighting inconsistencies in the client's speech or behavior to foster insight. (提出质疑帮助其认识不一致之处)",
  'Unconditional Positive Regard': "Unconditional Positive Regard (无条件积极关注): Accepting the client as a whole without judgment, regardless of behavior. (整体接纳，不依据行为好坏评判)",
  'Genuineness': "Genuineness (真诚一致): Being real and authentic without a professional mask. (以真正的我出现，表里一致)",
  'Self-Awareness': "Self-Awareness (自我觉察): Constantly evaluating one's own motivations, values, and traits during the session. (对自己的动机、价值取向进行评估)",
  'Questioning Skills': "Questioning Skills (提问技术): Balancing open and closed questions effectively. (合理使用开放式和封闭式提问)",
  'Summarizing': "Summarizing (总结技术): Synthesizing content, feelings, and future plans. (归纳总结咨询内容、情感与计划)",
  'Crisis Intervention': "Crisis Intervention (危机干预): Identifying and managing acute distress or high-risk situations professionally. (运用实证模型处理特殊、紧急情况)",
  'Working with Resistance': "Working with Resistance (处理阻抗): Navigating pushback or lack of engagement with empathy and control. (应对求助者的抵触、推诿或缺乏投入)",
  'Case Conceptualization': "Case Conceptualization (个案概念化): Integrating theory, assessment, and info into a clear clinical picture. (结合理论、测验与信息对个案进行准确概念化)",
};

export async function generateNewScenario(focusArea: FocusArea, language: Language): Promise<ClientScenario> {
  const culturalContext = language === 'zh' 
    ? "The scenario must reflect a Chinese cultural background (e.g., family-centric values, academic pressure like Gaokao, or high-intensity workplace social norms). The output must be in Chinese."
    : "The scenario must reflect a Western/English-speaking cultural background (e.g., individualism, direct communication styles). The output must be in English.";

  const prompt = `Generate a realistic psychological counseling client scenario for deliberate practice. 
  The focus of this practice session is: "${focusArea}". 
  Definition Context: ${COMPETENCY_DEFINITIONS[focusArea] || 'General professional counseling competency.'}
  ${culturalContext}
  The scenario should include a specific verbal statement from the client that tests the counselor's ability in this specific area. 
  Ensure the non-verbal cues (body posture, tone, etc.) provide depth to the emotional state.`;

  // Use 'gemini-3-flash-preview' for basic generation tasks.
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
  const focusArea = scenario.focusArea as FocusArea;
  const focusAreaContext = focusArea ? `The focus of this exercise is: ${focusArea}. Definition: ${COMPETENCY_DEFINITIONS[focusArea] || ''}` : "";
  const languageContext = language === 'zh' 
    ? "Return the feedback, strengths, growth areas, and revised response in Chinese."
    : "Return the feedback, strengths, growth areas, and revised response in English.";

  const prompt = `
    ACT AS AN EXPERT CLINICAL SUPERVISOR.
    Evaluate the counselor's response based on professional clinical competency standards and cultural sensitivity for a ${language === 'zh' ? 'Chinese' : 'Western'} context.

    SPECIFIC COMPETENCY FOCUS:
    ${focusAreaContext}

    ${languageContext}

    CLIENT SCENARIO:
    - Name: ${scenario.name} (${scenario.age} years old)
    - Background: ${scenario.background}
    - Non-verbal cues: ${scenario.nonVerbalCues}
    - Client said: "${scenario.statement}"

    COUNSELOR'S RESPONSE:
    "${userResponse}"

    Evaluation Criteria (Scores 0-100):
    1. Empathy (共情): Depth of emotional understanding.
    2. Reflection (反应): Accuracy of content/feeling reflection.
    3. Micro-skills (微技能): Technical execution (questioning, silence, etc).
    4. Professionalism (专业性): Ethical stance and professional tone.

    Provide a gold-standard revised response that demonstrates excellence in ${focusArea}.
  `;

  // Use 'gemini-3-pro-preview' for complex clinical reasoning tasks.
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
  const langPrompt = language === 'zh' 
    ? "Transcription task: Convert the provided Chinese audio to Chinese Simplified text. Provide a verbatim transcription. Do not summarize or add notes. Output only the text spoken."
    : "Transcription task: Convert the provided English audio to English text. Provide a verbatim transcription. Do not summarize or add notes. Output only the text spoken.";

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
