import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { db, saveWriting } from '@/services/db';
import { WRITING_TYPE_META } from '@/data/writingTypes';
import { useWritingStore } from '@/stores/writingStore';
import { navigate } from '@/lib/route';
import type { Writing } from '@/types/writing';

interface Props {
  writingId: string;
}

const SAVE_DEBOUNCE_MS = 800;

function countChars(text: string) {
  // 줄바꿈/공백 제외 길이도 함께 표시
  const stripped = text.replace(/\s+/g, '');
  return { total: text.length, noSpace: stripped.length };
}

function plainText(html: string) {
  // 임시 DOM으로 텍스트만 추출
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // <br> 또는 <p> 경계는 줄바꿈으로
  tmp.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  tmp.querySelectorAll('p, div, li').forEach((el) => {
    el.append(document.createTextNode('\n'));
  });
  return tmp.textContent?.replace(/\n{3,}/g, '\n\n').trim() ?? '';
}

export default function Editor({ writingId }: Props) {
  const [writing, setWriting] = useState<Writing | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const setError = useWritingStore((s) => s.setError);
  const debounceRef = useRef<number | null>(null);

  // Tiptap editor 인스턴스
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: '',
    editorProps: {
      attributes: {
        class:
          'ProseMirror prose prose-sm sm:prose-base max-w-none min-h-[300px] focus:outline-none px-4 py-3',
        'data-testid': 'editor-textarea',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      scheduleSave(html);
    },
  });

  const scheduleSave = useCallback(
    (html: string) => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(async () => {
        try {
          const w = await db.writings.get(writingId);
          if (!w) return;
          const last = w.revisions[w.revisions.length - 1];
          if (!last) return;
          const text = plainText(html);
          last.text = text;
          // HTML도 저장 (Tiptap 복원용). 별도 필드 없으니 text에 저장하고 복원 시 paragraph로
          last.timestamp = Date.now();
          await saveWriting(w);
          setSavedAt(Date.now());
        } catch (err) {
          setError(err instanceof Error ? err.message : '자동 저장 실패');
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [writingId, setError],
  );

  // 초기 로드: IndexedDB에서 글 가져와서 에디터 초기화
  useEffect(() => {
    let cancelled = false;
    db.writings.get(writingId).then((w) => {
      if (cancelled || !w) {
        if (!w) setError(`글(${writingId})을 찾을 수 없습니다.`);
        return;
      }
      setWriting(w);
      const last = w.revisions[w.revisions.length - 1];
      if (last && editor) {
        const html = last.text
          .split(/\n{2,}/)
          .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
          .join('');
        editor.commands.setContent(html || '<p></p>', false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [writingId, editor, setError]);

  // dev/e2e 전용: window에 testing 핸들 노출
  useEffect(() => {
    if (!editor) return;
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__wcTestEditor = {
        setText(text: string) {
          editor.commands.setContent(`<p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p>`, true);
        },
      };
    }
    return () => {
      if (import.meta.env.DEV) {
        delete (window as unknown as Record<string, unknown>).__wcTestEditor;
      }
    };
  }, [editor]);

  // 권장 길이 안내용
  const meta = writing ? WRITING_TYPE_META[writing.type] : null;
  const text = editor?.getText() ?? '';
  const { total, noSpace } = countChars(text);
  const lengthHint = (() => {
    if (!meta) return null;
    if (total < meta.recommendedLength.min) return `권장보다 짧아요 (${meta.recommendedLength.min}자 이상 추천)`;
    if (total > meta.recommendedLength.max) return `권장보다 길어요 (${meta.recommendedLength.max}자 이내 추천)`;
    return '권장 길이에 잘 맞아요';
  })();

  if (!writing) {
    return (
      <div className="text-[var(--color-ink-soft)]">글을 불러오는 중…</div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-2xl font-semibold">
          {meta?.emoji} {writing.type}{writing.topic ? ` — ${writing.topic}` : ''}
        </h2>
        <span className="text-xs text-[var(--color-ink-soft)]">
          권장 {meta?.recommendedLength.min}~{meta?.recommendedLength.max}자 · {meta?.structureGuide}
        </span>
      </header>

      <div className="rounded-2xl border border-[var(--color-paper-soft)] bg-[var(--color-paper)] focus-within:border-[var(--color-accent)]/60 transition">
        {editor ? <EditorContent editor={editor} /> : <div className="p-3 text-sm text-[var(--color-ink-soft)]">에디터 준비 중…</div>}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-ink-soft)]">
        <span data-testid="char-count">
          글자 수 <strong className="text-[var(--color-ink)]">{total}</strong>자 (공백 제외 {noSpace}자)
        </span>
        {lengthHint && <span>· {lengthHint}</span>}
        {savedAt && <span>· 자동 저장 {timeAgo(savedAt)}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full px-5 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm hover:opacity-90 disabled:opacity-50"
          disabled={total < 30}
          onClick={() => navigate(`/feedback/${writing.id}`)}
          data-testid="analyze-btn"
        >
          분석하기
        </button>
        <a
          className="rounded-full px-5 py-2 border border-[var(--color-ink-soft)]/40 text-sm hover:bg-[var(--color-paper-soft)]"
          href="#/list"
        >
          내 글 목록
        </a>
        {total < 30 && (
          <span className="text-xs text-[var(--color-ink-soft)] self-center">30자 이상 작성하면 분석할 수 있어요</span>
        )}
      </div>
    </section>
  );
}

function timeAgo(ts: number) {
  const sec = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (sec < 60) return `${sec}초 전`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}분 전`;
  return new Date(ts).toLocaleString('ko-KR');
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
