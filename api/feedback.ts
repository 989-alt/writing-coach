import type { IncomingMessage, ServerResponse } from 'node:http';
import { SchemaType } from '@google/generative-ai';
import { methodGuard, readJson, sendError, sendJson } from './_lib/http';
import { callGeminiJson } from './_lib/gemini';
import { FEEDBACK_SYSTEM_PROMPT, buildFeedbackPrompt } from './_lib/prompts';

interface RequestBody {
  writingType?: string;
  grade?: number;
  text?: string;
}

const GRADE_ENUM = ['잘함', '괜찮음', '노력', '다시'];
const AREA_ENUM = ['spelling', 'structure', 'context', 'expression'];

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    praise: { type: SchemaType.STRING },
    scores: {
      type: SchemaType.OBJECT,
      properties: {
        spelling: { type: SchemaType.STRING, enum: GRADE_ENUM },
        structure: { type: SchemaType.STRING, enum: GRADE_ENUM },
        context: { type: SchemaType.STRING, enum: GRADE_ENUM },
        expression: { type: SchemaType.STRING, enum: GRADE_ENUM },
      },
      required: ['spelling', 'structure', 'context', 'expression'],
    },
    inlineMarks: {
      type: SchemaType.ARRAY,
      minItems: 0,
      maxItems: 8,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          area: { type: SchemaType.STRING, enum: AREA_ENUM },
          snippet: { type: SchemaType.STRING },
          comment: { type: SchemaType.STRING },
        },
        required: ['area', 'snippet', 'comment'],
      },
    },
    encouragement: { type: SchemaType.STRING },
  },
  required: ['praise', 'scores', 'inlineMarks', 'encouragement'],
} as const;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!methodGuard(req, res)) return;
  let body: RequestBody;
  try {
    body = await readJson<RequestBody>(req);
  } catch (err) {
    return sendError(res, 400, err instanceof Error ? err.message : '잘못된 요청 본문');
  }
  const { writingType, grade, text } = body;
  if (!writingType || typeof writingType !== 'string') {
    return sendError(res, 400, 'writingType이 필요합니다.');
  }
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return sendError(res, 400, '학생 글이 너무 짧아요. 30자 이상 작성한 뒤 분석해 주세요.');
  }
  try {
    const result = await callGeminiJson<{
      praise: string;
      scores: { spelling: string; structure: string; context: string; expression: string };
      inlineMarks: { area: string; snippet: string; comment: string }[];
      encouragement: string;
    }>({
      systemInstruction: FEEDBACK_SYSTEM_PROMPT,
      userPrompt: buildFeedbackPrompt({ writingType, grade, text }),
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.5,
      maxOutputTokens: 2048,
    });

    // snippet이 본문에 실제 등장하는지 검증, 없으면 제거
    const filteredMarks = (result.inlineMarks ?? []).filter((m) => m.snippet && text.includes(m.snippet));

    sendJson(res, 200, {
      praise: result.praise ?? '',
      scores: result.scores,
      inlineMarks: filteredMarks,
      encouragement: result.encouragement ?? '',
      generatedAt: Date.now(),
    });
  } catch (err) {
    sendError(res, 500, err instanceof Error ? err.message : 'Gemini 호출 실패');
  }
}

export const config = { maxDuration: 60 };
