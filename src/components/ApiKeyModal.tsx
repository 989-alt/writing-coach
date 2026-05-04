import { useEffect, useRef, useState } from 'react';
import { getApiKey, setApiKey } from '@/services/ai';

interface Props {
  open: boolean;
  onClose(): void;
  /** 첫 진입 시(키가 아예 없을 때) onboarding 모드로 표시. 닫기 X. */
  onboarding?: boolean;
}

export default function ApiKeyModal({ open, onClose, onboarding = false }: Props) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setValue(getApiKey());
      setSaved(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  function handleSave() {
    setApiKey(value);
    setSaved(true);
    setTimeout(() => onClose(), 600);
  }

  function handleClear() {
    setApiKey('');
    setValue('');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gemini API 키 설정"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (!onboarding && e.target === e.currentTarget) onClose();
      }}
      data-testid="api-key-modal"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--color-paper)] border border-[var(--color-paper-soft)] p-5 space-y-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {onboarding ? 'Gemini API 키를 한 번만 입력해 주세요' : 'Gemini API 키 설정'}
          </h2>
          <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
            글감/첫마디/첨삭 기능은 Google Gemini를 사용합니다. 키는{' '}
            <strong>이 브라우저에만</strong> 저장되며 어떤 서버로도 전송되지 않아요. 다른 기기에서는
            새로 입력해야 해요.
          </p>
        </div>

        <ol className="text-xs text-[var(--color-ink-soft)] list-decimal pl-5 space-y-1">
          <li>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] underline"
            >
              Google AI Studio
            </a>{' '}
            에 접속 → "API 키 만들기"
          </li>
          <li>발급된 키(AIzaSy로 시작)를 복사</li>
          <li>아래 입력창에 붙여넣고 [저장]</li>
        </ol>

        <div className="space-y-2">
          <label className="text-xs font-medium" htmlFor="api-key-input">
            API 키
          </label>
          <div className="flex gap-2">
            <input
              id="api-key-input"
              ref={inputRef}
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="AIzaSy..."
              autoComplete="off"
              spellCheck={false}
              className="flex-1 rounded-full border border-[var(--color-ink-soft)]/40 px-4 py-2 bg-[var(--color-paper-soft)]/50 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)]"
              data-testid="api-key-input"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="rounded-full px-3 py-2 border border-[var(--color-ink-soft)]/40 text-xs"
              aria-label={show ? '키 숨기기' : '키 보기'}
            >
              {show ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!value.trim()}
            className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm disabled:opacity-50"
            data-testid="api-key-save"
          >
            {saved ? '✓ 저장됨' : '저장'}
          </button>
          {!onboarding && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-soft)]"
            >
              취소
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto rounded-full px-3 py-2 text-xs text-[var(--color-grade-again)] hover:underline"
            >
              저장된 키 삭제
            </button>
          )}
        </div>

        <p className="text-[10px] text-[var(--color-ink-soft)]">
          ⚠️ 보안: Google AI Studio의 키 설정에서 HTTP referrer 제한을{' '}
          <code className="font-mono">https://989-alt.github.io/*</code> 로 걸어 두면 다른 사이트에서
          이 키가 도용되지 않습니다.
        </p>
      </div>
    </div>
  );
}
