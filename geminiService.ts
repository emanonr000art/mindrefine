import { GoogleGenAI, Type } from "@google/genai";
import { ClientScenario, Feedback, FocusArea, Language, ChatMessage } from "./types";

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

const NEXT_TURN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    nonVerbal: { type: Type.STRING },
  },
  required: ["text", "nonVerbal"]
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
    interactionAnalysis: { type: Type.STRING },
  },
  required: ["score", "strengths", "growthAreas", "competencyAnalysis", "revisedResponse", "explanation", "interactionAnalysis"]
};

const COMPETENCY_DEFINITIONS: Record<string, string> = {
  // EFT
  'EFT - Empathic Validation': "共情验证: 验证来访者痛苦的内在逻辑。",
  'EFT - Evocative Responding': "启发性回应: 使用生动语言唤起边缘体验。",
  'EFT - Deepening Emotion': "情绪深化: 从次生情绪引向原生适应性情绪。",
  'EFT - Marker Identification': "标记识别: 识别未竟之事、冲突裂隙等。",
  // Microskills
  'Emotional Reflection': "情感反映: 准确识别并回馈来访者的情感状态。",
  'Content Reflection': "内容反映: 释义并重述来访者的核心信息。",
  'Questioning Skills': "提问技术: 灵活使用开放式和封闭式提问。",
  'Summarizing': "总结技术: 综合会谈中的内容、情感和未来计划。",
  // Process
  'Initial Interview': "首次会谈: 建立关系、评估和界限说明。",
  'Referral': "转介: 识别专业局限并进行专业过渡处理。",
  'Termination': "结案阶段: 处理分离焦虑并巩固咨询成效。",
  // Situational
  'Working with Resistance': "处理阻抗: 以共情姿态应对临床推诿或不配合。",
  'Crisis Intervention': "危机干预: 识别并管理高度痛苦或高风险状况。",
};

// 生成初始个案
export async function generateNewScenario(focusArea: FocusArea, language: Language): Promise<ClientScenario> {
  const languageName = language === 'zh' ? 'Chinese' : 'English';
  const prompt = `Generate a deep psychological scenario for deliberate practice.
    Focus Skill: ${focusArea} (${COMPETENCY_DEFINITIONS[focusArea] || ''}). 
    Target Language: ${languageName}. 
    Include complex history and a specific client statement that challenges this skill.
    If focus is EFT, ensure a visible clinical marker.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: SCENARIO_SCHEMA }
  });
  return { ...JSON.parse(response.text || '{}'), focusArea, language };
}

// 模拟来访者下一轮反应
export async function getNextClientTurn(
  scenario: ClientScenario,
  history: ChatMessage[],
  language: Language
): Promise<{ text: string; nonVerbal: string }> {
  const languageName = language === 'zh' ? 'Chinese' : 'English';
  const historyText = history.map(h => `${h.role}: ${h.text}`).join('\n');
  
  const prompt = `
    You are the client: ${scenario.name}, Age ${scenario.age}.
    Background: ${scenario.background}
    Focus Marker: ${scenario.focusArea}

    Current Session History:
    ${historyText}

    Based on the counselor's last response, how do you react? 
    Consider if they met your emotional needs or if you feel misunderstood.
    Output in ${languageName}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: NEXT_TURN_SCHEMA }
  });
  return JSON.parse(response.text || '{}');
}

// 深度综合督导评估
export async function evaluateFullDialogue(
  scenario: ClientScenario,
  history: ChatMessage[],
  language: Language
): Promise<Feedback> {
  const languageName = language === 'zh' ? 'Chinese' : 'English';
  const historyText = history.map((h, i) => `Turn ${i+1} [${h.role}]: ${h.text}`).join('\n');

  const prompt = `
    ACT AS AN EXPERT CLINICAL SUPERVISOR.
    Target Language: ${languageName}

    Analyze the FULL DIALOGUE for: ${scenario.focusArea}.
    Scenario Context: ${scenario.background}

    Session History:
    ${historyText}

    Evaluation Tasks:
    1. Comprehensive score.
    2. Strength/Growth identification.
    3. interactionAnalysis: Analyze the interaction pattern and alliance.
    4. revisedResponse: Provide a expert alternative trajectory.
    
    Output in Simplified Chinese if language is zh.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: FEEDBACK_SCHEMA }
  });

  return JSON.parse(response.text || '{}');
}

export async function transcribeAudio(base64Audio: string, mimeType: string, language: Language): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Audio } },
        { text: "Output ONLY the verbatim transcription of this audio. Do not include any preambles, introductory sentences, or filler words like 'Here is the transcription'. Output should only be the recognized text." },
      ],
    },
  });
  
  // Clean up potential conversational filler just in case
  let text = response.text?.trim() || "";
  text = text.replace(/^Here is the verbatim transcription.*?:/i, "").trim();
  text = text.replace(/^以下是该音频的文字转录内容.*?:/i, "").trim();
  return text;
}
