import type { IncomingMessage, ServerResponse } from 'node:http';
import { SchemaType } from '@google/generative-ai';
import { methodGuard, readJson, sendError, sendJson } from './_lib/http.js';
import { callGeminiJson } from './_lib/gemini.js';
import { OPENING_SYSTEM_PROMPT, buildOpeningPrompt } from './_lib/prompts.js';

interface RequestBody {
  writingType?: string;
  grade?: number;
  topic?: string;
}

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    openings: {
      type: SchemaType.ARRAY,
      minItems: 3,
      maxItems: 3,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          approach: { type: SchemaType.STRING },
          sentence: { type: SchemaType.STRING },
          tone: { type: SchemaType.STRING },
        },
        required: ['approach', 'sentence', 'tone'],
      },
    },
  },
  required: ['openings'],
} as const;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!methodGuard(req, res)) return;
  let body: RequestBody;
  try {
    body = await readJson<RequestBody>(req);
  } catch (err) {
    return sendError(res, 400, err instanceof Error ? err.message : '잘못된 요청 본문');
  }
  const { writingType, grade, topic } = body;
  if (!writingType || typeof writingType !== 'string') {
    return sendError(res, 400, 'writingType이 필요합니다.');
  }
  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return sendError(res, 400, 'topic이 필요합니다.');
  }
  try {
    const result = await callGeminiJson<{
      openings: { approach: string; sentence: string; tone: string }[];
    }>({
      systemInstruction: OPENING_SYSTEM_PROMPT,
      userPrompt: buildOpeningPrompt({ writingType, grade, topic }),
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.9,
      maxOutputTokens: 768,
    });
    if (!Array.isArray(result.openings) || result.openings.length < 1) {
      return sendError(res, 502, 'AI 응답에 첫 문장 후보가 비어 있어요.');
    }
    sendJson(res, 200, { openings: result.openings.slice(0, 3) });
  } catch (err) {
    sendError(res, 500, err instanceof Error ? err.message : 'Gemini 호출 실패');
  }
}

export const config = { maxDuration: 30 };
