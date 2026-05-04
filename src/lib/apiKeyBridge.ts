import { API_KEY_MISSING_ERROR } from '@/services/ai';

/** 키 입력 모달을 열도록 App에 신호. */
export function openApiKeyModal(): void {
  window.dispatchEvent(new Event('writing-coach:open-api-key-modal'));
}

/** 에러가 "API 키 미설정"인지 판별. */
export function isMissingApiKeyError(err: unknown): boolean {
  if (err instanceof Error) return err.message.includes(API_KEY_MISSING_ERROR);
  if (typeof err === 'string') return err.includes(API_KEY_MISSING_ERROR);
  return false;
}

/** 사용자에게 노출할 친절한 메시지 (에러 객체 → 문자열). */
export function humanizeAiError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes(API_KEY_MISSING_ERROR)) {
      return 'Gemini API 키가 설정되지 않았어요. 우상단 [🔑 키 설정] 버튼으로 키를 입력해 주세요.';
    }
    if (err.message.includes('API key was reported as leaked')) {
      return '이 API 키는 노출되어 비활성화됐어요. 새 키를 발급받아 입력해 주세요.';
    }
    if (err.message.includes('API_KEY_INVALID') || err.message.includes('400')) {
      return 'API 키가 올바르지 않거나 권한이 없어요. 키를 다시 확인해 주세요.';
    }
    if (err.message.includes('429') || err.message.toLowerCase().includes('quota')) {
      return '오늘 무료 사용량을 초과했어요. 잠시 후 다시 시도하거나 다른 키를 사용해 주세요.';
    }
    return err.message;
  }
  return '알 수 없는 오류가 발생했어요.';
}
