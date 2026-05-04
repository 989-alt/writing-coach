import type { IncomingMessage, ServerResponse } from 'node:http';
import { SchemaType } from '@google/generative-ai';
import { methodGuard, readJson, sendError, sendJson } from './_lib/http.js';
import { callGeminiJson } from './_lib/gemini.js';
import { TOPIC_SYSTEM_PROMPT, buildTopicPrompt } from './_lib/prompts.js';

interface RequestBody {
  writingType?: string;
  grade?: number;
  keywords?: string;
}

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    topics: {
      type: SchemaType.ARRAY,
      minItems: 6,
      maxItems: 8,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
        },
        required: ['title', 'description'],
      },
    },
  },
  required: ['topics'],
} as const;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!methodGuard(req, res)) return;
  let body: RequestBody;
  try {
    body = await readJson<RequestBody>(req);
  } catch (err) {
    return sendError(res, 400, err instanceof Error ? err.message : '잘못된 요청 본문');
  }
  const { writingType, grade, keywords } = body;
  if (!writingType || typeof writingType !== 'string') {
    return sendError(res, 400, 'writingType이 필요합니다.');
  }
  if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
    return sendError(res, 400, 'keywords가 필요합니다.');
  }
  try {
    const result = await callGeminiJson<{ topics: { title: string; description: string }[] }>({
      systemInstruction: TOPIC_SYSTEM_PROMPT,
      userPrompt: buildTopicPrompt({ writingType, grade, keywords }),
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.85,
      maxOutputTokens: 1024,
    });
    if (!Array.isArray(result.topics) || result.topics.length === 0) {
      return sendError(res, 502, 'AI 응답에 글감이 비어 있어요.');
    }
    sendJson(res, 200, { topics: result.topics.slice(0, 8) });
  } catch (err) {
    sendError(res, 500, err instanceof Error ? err.message : 'Gemini 호출 실패');
  }
}

// Vercel Functions에서 함수 실행 시간 늘림 (Pro 플랜 시)
export const config = { maxDuration: 30 };
