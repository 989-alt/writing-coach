/** 사용자에게 노출할 친절한 메시지 (에러 객체 → 문자열). */
export function humanizeAiError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('API key was reported as leaked')) {
      return '서비스 키에 일시적 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
    }
    if (err.message.includes('API_KEY_INVALID') || err.message.includes('400')) {
      return '서비스에 일시적 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
    }
    if (err.message.includes('429') || err.message.toLowerCase().includes('quota')) {
      return '오늘 사용량이 많아 잠시 응답이 어려워요. 잠시 후 다시 시도해 주세요.';
    }
    if (err.message.includes('503') || err.message.toLowerCase().includes('overloaded')) {
      return 'AI 서버가 잠시 바빠요. 10초 후 다시 시도해 주세요.';
    }
    if (err.message.includes('500')) {
      return '서버에서 일시적 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
    }
    return err.message;
  }
  return '알 수 없는 오류가 발생했어요.';
}
