import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';

let cachedClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수를 확인하세요.');
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

export interface GeminiJsonOptions {
  systemInstruction: string;
  userPrompt: string;
  /** Gemini responseSchema. SchemaType + readonly 키 허용을 위해 unknown 으로 받음. */
  responseSchema: unknown;
  temperature?: number;
  maxOutputTokens?: number;
}

/** Gemini 2.5 Flash로 JSON 강제 응답을 받아 파싱한다. thinking 비활성화로 출력 토큰 절약. */
export async function callGeminiJson<T = unknown>(opts: GeminiJsonOptions): Promise<T> {
  const client = getClient();
  const generationConfig: GenerationConfig = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 4096,
    responseMimeType: 'application/json',
    // @ts-expect-error responseSchema는 SDK 버전에 따라 타입 정의가 약하다
    responseSchema: opts.responseSchema,
    thinkingConfig: { thinkingBudget: 0 },
  };
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: opts.systemInstruction,
    generationConfig,
  });
  const result = await model.generateContent(opts.userPrompt);
  const candidate = result.response.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = result.response.text();
  if (finishReason && finishReason !== 'STOP') {
    if (finishReason === 'MAX_TOKENS') {
      throw new Error('AI 응답이 너무 길어 잘렸어요. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error(`AI 응답이 정상 종료되지 않았어요 (${finishReason}).`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error(`Gemini 응답을 JSON으로 파싱하지 못했습니다: ${text.slice(0, 200)}`);
  }
}
