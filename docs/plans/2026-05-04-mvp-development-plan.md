# Writing Coach MVP 개발 계획

**날짜**: 2026-05-04
**마감**: 2026-05-06 (D-2)
**작성자**: 이천송정초 이선학
**프로젝트 경로**: `C:\Users\hit\Desktop\바이브코딩 공모전\writing-coach`

---

## 0. 재개 시 첫 단계 (Claude Code 재시작 후 읽을 것)

1. 본 문서 + `docs/PRD.md`를 먼저 읽기
2. 사용자가 ` Gemini API key`를 갖고 있는지 확인 → `.env.local`의 `VITE_GEMINI_API_KEY`로 사용
3. **Phase 1부터 순차 실행**, 각 Phase 끝나면 빌드 검증
4. Phase 5 완료 후 Playwright로 모든 기능 직접 테스트
5. 버그 발견 시 즉시 수정 후 재테스트, 버그 없을 때까지 반복

---

## 1. 프로젝트 컨텍스트

### 1.1. 작업 디렉터리
```
C:\Users\hit\Desktop\바이브코딩 공모전\writing-coach\
├── docs/
│   ├── PRD.md                                    ← 핵심 사양서
│   └── plans/
│       ├── 2026-05-04-writing-coach-design.md    ← 초기 설계 (참고)
│       └── 2026-05-04-mvp-development-plan.md    ← 본 문서
├── src/        (생성 예정)
├── api/        (생성 예정 - Gemini 프록시)
├── public/     (생성 예정)
└── docs/
```

### 1.2. 이미 작성된 자료
- ✅ `docs/PRD.md` — 11개 핵심 기능(F1~F11) 명세, 절대 금지 사항 10개, AI 프롬프트 설계
- ✅ `docs/plans/2026-05-04-writing-coach-design.md` — 초기 설계
- ❌ 코드는 아직 0줄

### 1.3. 핵심 제약 (PRD에서 옮김)
- **로컬 우선**: IndexedDB만, 서버 0
- **글 종류 10가지** 별도 프롬프트 필요
- **AI는 코치, 작가가 아님** (본문 자동 작성 X)
- **글감/첫마디 자동 입력 X** (학생이 직접 타이핑)
- **점수·랭킹·타인 비교 X**
- **개인정보·계정·로그인 X**
- **음성·일일챌린지·통계·다짐·게이미피케이션 X** (단순성)

---

## 2. MVP 범위 — 11개 핵심 기능

| # | 기능 | 우선순위 |
|---|---|---|
| F1 | 글 종류 선택 + 단원 매핑 | P0 |
| F2 | 글감 찾기 (Topic Finder) | P0 |
| F3 | 첫마디 뽑기 (Opening Sentence Helper) | P0 |
| F4 | 글쓰기 에디터 (자동 저장, 글자수) | P0 |
| F5 | AI 4영역 첨삭 | P0 |
| F6 | 인라인 시각 피드백 | P0 |
| F7 | 종합 코멘트 + 격려 | P0 |
| F8 | 자가 첨삭 워크플로 (회차 이력) | P0 |
| F9 | PDF 출력 | P0 |
| F10 | 로컬 저장 (IndexedDB) | P0 |
| F11 | 22개정 교육과정 정합성 (단원 데이터) | P0 |

P1 부가 기능(F12~F14)은 P0 완료 후 시간 남으면.

---

## 3. 개발 단계 (Phase별)

### Phase 1: 프로젝트 셋업 (예상 1~2시간)
- [ ] Vite + React 19 + TypeScript + Tailwind CSS 4 셋업
- [ ] `package.json` 의존성: react, react-dom, tailwindcss, @tailwindcss/vite, dexie (IndexedDB), tiptap (에디터), jspdf, html2canvas
- [ ] `vite.config.ts` (base path, 환경변수)
- [ ] `tsconfig.json`, `tailwind.config.css`, 기본 `index.html`
- [ ] `.gitignore` (node_modules, dist, .env.local)
- [ ] `.env.local.example` (`VITE_GEMINI_API_KEY=`)
- [ ] `src/main.tsx`, `src/App.tsx` (라우팅 골격)
- [ ] **검증**: `npm run dev`로 빈 화면 띄우기

### Phase 2: 데이터 + 상태 (예상 1~2시간)
- [ ] `src/types/writing.ts` — Writing/Revision/Feedback 타입 (PRD 9장)
- [ ] `src/data/units.ts` — 22개정 5~6학년 국어 단원 매핑 (글 종류별)
- [ ] `src/data/writingTypes.ts` — 10가지 글 종류 메타데이터 (이름·설명·권장 길이·평가 차원)
- [ ] `src/services/db.ts` — Dexie IndexedDB schema + CRUD
- [ ] `src/stores/writingStore.ts` — Zustand store (현재 글, 회차, 첨삭 상태)
- [ ] **검증**: 콘솔에서 IndexedDB CRUD 동작 확인

### Phase 3: UI 화면 (F1, F4) (예상 2~3시간)
- [ ] `src/components/Home.tsx` — 메인, "글쓰기 시작" + "내 글 목록"
- [ ] `src/components/WritingTypeSelect.tsx` (F1) — 10종 카드 + 단원 안내
- [ ] `src/components/Editor.tsx` (F4) — Tiptap 에디터, 자동 저장, 글자수, 권장 길이 표시
- [ ] `src/components/MyWritings.tsx` — 글 목록 화면
- [ ] 라우팅 (React Router 없이 hash-based 또는 단일 SPA 상태)
- [ ] **검증**: 글 종류 선택 → 에디터 → 글 작성 → 자동 저장 → 새로고침 후 복원

### Phase 4: AI 통합 (F2, F3, F5) (예상 3~4시간)

#### 4-1. Vercel Functions (Gemini API 프록시)
- [ ] `api/topics.ts` — 글감 찾기 (Gemini 호출)
- [ ] `api/openings.ts` — 첫마디 뽑기 (Gemini 호출)
- [ ] `api/feedback.ts` — 4영역 첨삭 (Gemini 호출)
- [ ] 글 종류별 프롬프트 모듈 (`api/prompts/논설문.ts`, `시.ts` 등)
- [ ] CORS 설정, 에러 핸들링, JSON 출력 강제

#### 4-2. 클라이언트 호출
- [ ] `src/services/ai.ts` — fetch 래퍼 (3개 엔드포인트)
- [ ] `src/components/TopicFinder.tsx` (F2) — 키워드 입력 → 글감 6~8개 카드
- [ ] `src/components/OpeningHelper.tsx` (F3) — 첫 문장 후보 3개 (자동 입력 X 가드)
- [ ] **검증**: Gemini API 키 입력 후 글감·첫마디·첨삭 흐름 모두 작동

### Phase 5: 피드백 UI (F6, F7) (예상 2~3시간)
- [ ] `src/components/InlineFeedback.tsx` (F6) — 4영역 색상 마킹 + 풍선 설명
- [ ] `src/components/FeedbackPanel.tsx` (F7) — 잘한 점·4영역 등급·격려
- [ ] 4단계 등급 표시 (잘함·괜찮음·노력·다시) — **숫자 점수 X**
- [ ] **검증**: AI 첨삭 결과를 인라인 + 종합으로 시각화

### Phase 6: 자가 첨삭 + 출력 (F8, F9) (예상 2~3시간)
- [ ] `src/components/RevisionFlow.tsx` (F8) — "다시 분석" + 회차 이력 (최대 5)
- [ ] `src/components/RevisionCompare.tsx` — 회차별 글 + 등급 변화
- [ ] `src/services/pdf.ts` (F9) — jsPDF + html2canvas, 한국어 폰트 (Pretendard·Noto Sans KR)
- [ ] **검증**: 1차 글 → AI 첨삭 → 수정 → 2차 → 3차 → PDF 출력

### Phase 7: 폴리싱 + 절대 금지 가드 (예상 1~2시간)
- [ ] PRD 7장 Hard Constraints 자가 점검 (HC1~HC10)
- [ ] System prompt에 "비판 톤 금지", "본문 작성 금지", "점수 출력 금지" 명시
- [ ] 첫마디 카드 클릭 시 자동 입력 X 검증
- [ ] 다크/라이트 모드 토글 (간단 버전)
- [ ] 모바일 반응형 (375px+) 검증
- [ ] **검증**: PRD 절대 금지 10개 모두 통과

---

## 4. Phase 8: 직접 테스트 + 버그 수정 (예상 2~4시간)

### 4.1. Playwright 자동화 테스트
- [ ] `tests/e2e.spec.ts` — 다음 시나리오 자동 검증:
  1. 홈 → 글쓰기 시작 → 글 종류 "논설문" 선택
  2. 글감 찾기 → 키워드 "환경" 입력 → 글감 카드 6~8개 표시
  3. 글감 1개 선택 → 첫마디 뽑기 → 후보 3개 표시
  4. 후보 클릭해도 에디터 자동 입력 X 검증 (Hard Constraint)
  5. 학생이 글 입력 → 자동 저장 → 새로고침 후 복원
  6. 분석하기 → AI 첨삭 결과 4영역 등급 + 인라인 마킹 + 격려 표시
  7. 글 수정 → 다시 분석 → 회차 2건 비교
  8. PDF 다운로드 → 파일명 `글쓰기_논설문_YYYYMMDD.pdf`
  9. 절대 금지 가드:
     - "당신의 글은 75점입니다" 같은 숫자 점수 출력 X
     - "잘못 썼다"·"엉망이다" 부정 표현 X
     - SNS 공유 버튼 X
     - 회원가입·로그인 폼 X
     - 광고·결제 노출 X

### 4.2. 글 종류별 검증 (10종 모두)
- [ ] 설명문 / 논설문 / 뉴스 기사 / 이야기 / 시 / 일기 / 독후감 / 편지글 / 광고문 / 안내문
- [ ] 각 종류마다 짧은 샘플 글 입력 → 종류별 다른 평가 차원 적용 확인

### 4.3. 버그 수정 루프
1. 테스트 실행 → 실패한 케이스 리스트업
2. 우선순위: Hard Constraint 위반(P0) → 기능 작동 안 됨(P1) → UI 어색함(P2)
3. 1건 수정 → 재실행 → 모두 통과까지 반복
4. **버그 0개 확인 후 종료**

---

## 5. 기술 스택 확정

| 영역 | 선택 |
|---|---|
| 프레임워크 | React 19 + TypeScript + Vite 7 |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite` 플러그인) |
| 에디터 | **Tiptap 2** (한국어 IME + 인라인 마킹) |
| 로컬 저장 | **IndexedDB (Dexie.js)** |
| 상태 관리 | **Zustand** |
| AI | **Google Gemini 2.5 Flash** (`@google/generative-ai`) |
| 백엔드 | **Vercel Serverless Functions** (3종: topics / openings / feedback) |
| PDF | jsPDF + html2canvas |
| 폰트 | Pretendard / Noto Sans KR (CDN) |
| 테스트 | Playwright (e2e) |
| 배포 | Vercel (자동 CI/CD) |

---

## 6. 환경변수

`.env.local` (사용자 직접 작성 필요)
```
VITE_GEMINI_API_KEY=AIzaSy...
```

또는 Vercel 환경변수로:
```
GEMINI_API_KEY=AIzaSy...   # Serverless Functions에서 사용 (BYOK)
```

서버사이드 사용 권장 (API 키 노출 방지). 단 MVP에서는 클라이언트 직접 호출도 가능.

---

## 7. AI 프롬프트 핵심 (PRD 11장 요약)

### 7.1. 글감 찾기 (`/api/topics`)
- 입력: `writingType`, `grade`, `keywords`
- 출력 JSON: `{ topics: [{ title, description }] × 8 }`
- 가드: 본문·예시 글 X

### 7.2. 첫마디 뽑기 (`/api/openings`)
- 입력: `writingType`, `topic`, `grade`
- 출력 JSON: `{ openings: [{ approach, sentence, tone }] × 3 }`
- 접근법: 정공법 / 질문형 / 장면 묘사

### 7.3. 4영역 첨삭 (`/api/feedback`)
- 입력: `writingType`, `grade`, `text`
- 출력 JSON:
  ```json
  {
    "praise": "잘한 점 1~2문장",
    "scores": { "spelling": "잘함|괜찮음|노력|다시", "structure": "...", "context": "...", "expression": "..." },
    "inlineMarks": [{ "area": "spelling|structure|context|expression", "snippet": "원문 발췌", "comment": "개선 제안" }],
    "encouragement": "격려 한 줄"
  }
  ```
- 글 종류별 별도 프롬프트 (시·뉴스·이야기 등 10종)
- **절대 가드**: 비판 톤 X, 100점 점수 X, AI 자동 수정 X

---

## 8. 데이터 모델 (PRD 9장)

```ts
// src/types/writing.ts
export type WritingType = '설명문' | '논설문' | '뉴스기사' | '이야기' | '시' | '일기' | '독후감' | '편지글' | '광고문' | '안내문';
export type Grade = '잘함' | '괜찮음' | '노력' | '다시';

export interface Writing {
  id: string;
  type: WritingType;
  grade?: 3 | 4 | 5 | 6;
  topic?: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  revisions: Revision[];
}

export interface Revision {
  index: number;
  text: string;
  feedback: Feedback | null;
  timestamp: number;
}

export interface Feedback {
  praise: string;
  scores: { spelling: Grade; structure: Grade; context: Grade; expression: Grade };
  inlineMarks: InlineMark[];
  encouragement: string;
  generatedAt: number;
}

export interface InlineMark {
  area: 'spelling' | 'structure' | 'context' | 'expression';
  snippet: string;
  comment: string;
}
```

---

## 9. 화면 라우팅 (Hash-based, React Router 미사용)

| Hash | 화면 | 컴포넌트 |
|---|---|---|
| `#/` | 홈 | `Home` |
| `#/new` | 글 종류 선택 | `WritingTypeSelect` |
| `#/topic` | 글감 찾기 | `TopicFinder` |
| `#/opening` | 첫마디 뽑기 | `OpeningHelper` |
| `#/edit/:id` | 에디터 | `Editor` |
| `#/feedback/:id` | 첨삭 결과 | `FeedbackView` |
| `#/list` | 내 글 목록 | `MyWritings` |

---

## 10. 절대 금지 가드 자가 점검 체크리스트

테스트 전 마지막 검증 (PRD 7장).

- [ ] HC1: AI가 본문·결론을 자동 작성 → 코드·프롬프트에서 차단
- [ ] HC2: 첫마디 자동 입력 → 클릭 핸들러에 자동 입력 로직 없음
- [ ] HC3: 100점 점수·타인 비교 → 등급은 4단계 단어만
- [ ] HC4: 부정 톤 → System prompt에 명시
- [ ] HC5: 실명·학교·이메일 강제 → 입력 폼에 없음
- [ ] HC6: 서버 저장 → 글은 IndexedDB만, AI 호출 시 `noLog`
- [ ] HC7: SNS 공유·광고·결제 → UI에 없음
- [ ] HC8: 시간 타이머·강제 길이 → 안내만, 강제 X
- [ ] HC9: 친구 글 첨삭 → "내가 직접 쓴 글입니다" 체크박스 (선택)
- [ ] HC10: 글감/첫마디 본문 미리보기 → 응답에 본문 텍스트 없음

---

## 11. 마감 일정 (D-2)

| 시간 | 작업 |
|---|---|
| 5/4 (오늘) 21:00~24:00 | Phase 1~3 (셋업, 데이터, UI 골격) |
| 5/5 09:00~13:00 | Phase 4 (AI 통합) |
| 5/5 13:00~17:00 | Phase 5~6 (피드백 UI, 자가 첨삭, PDF) |
| 5/5 17:00~22:00 | Phase 7 (폴리싱, 가드 검증) |
| 5/6 09:00~13:00 | Phase 8 (Playwright 테스트, 버그 수정) |
| 5/6 13:00~17:00 | 배포 (Vercel), 제안서 작성, 마감 제출 |

여유 시간 0. 풀타임 가정.

---

## 12. 제출물

1. **MVP 코드** (GitHub 저장소)
2. **배포 URL** (Vercel)
3. **서비스 제안서 .md** (CineEdu·Survivor Brawl 양식 따름)
4. **시연 영상 또는 GIF** (선택)

---

## 13. 위험 요소 + 대응

| 위험 | 대응 |
|---|---|
| Gemini JSON 출력이 불안정 | `responseMimeType: "application/json"` + `responseSchema` 강제 |
| 한국어 IME 입력 깨짐 | Tiptap의 한국어 IME 옵션 확인, contentEditable fallback |
| Playwright 한국어 입력 어려움 | `page.keyboard.type` 대신 `page.fill` 사용 |
| Vercel Function timeout (10초) | maxDuration 60초 설정, 또는 클라이언트 직접 호출로 fallback |
| 글 종류별 프롬프트 분기가 많음 | 공통 템플릿 + 종류별 변수 차이로 단순화 |
| 한국어 폰트 PDF 깨짐 | jsPDF로 한글 안 됨 → html2canvas로 이미지 캡처 후 PDF 삽입 |

---

## 14. 다음 액션 (재시작 후 즉시)

```
1. 현재 디렉터리: cd "C:\Users\hit\Desktop\바이브코딩 공모전\writing-coach"
2. 본 문서 + docs/PRD.md 읽기
3. Phase 1 시작: package.json + vite.config.ts 작성 → npm install → npm run dev로 빈 화면 확인
4. 사용자에게 Gemini API key 확인 (있으면 .env.local에 입력)
5. Phase 2~7 순차 실행 (각 Phase 끝 npm run build로 검증)
6. Phase 8 Playwright 테스트 + 버그 수정 루프
7. 모두 통과 시 배포 + 제안서 작성
```

---

*Auto mode 활성화 상태로 진행. 사용자 추가 입력 없이 Phase 1~8 자율 진행. 단 destructive·외부 시스템 영향 시 명시적 컨펌 받음.*
