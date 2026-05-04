import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Writing, FeedbackArea } from '@/types/writing';
import { WRITING_TYPE_META } from '@/data/writingTypes';
import { UNITS_BY_TYPE } from '@/data/units';

const AREA_LABEL: Record<FeedbackArea, string> = {
  spelling: '맞춤법·문장',
  structure: '구조',
  context: '맥락·논리',
  expression: '표현·어휘',
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

function buildPrintableHtml(writing: Writing): string {
  const meta = WRITING_TYPE_META[writing.type];
  const last = writing.revisions[writing.revisions.length - 1];
  const fb = last?.feedback;
  const units = UNITS_BY_TYPE[writing.type] ?? [];
  const unitText = units.map((u) => `${u.unitTitle} (${u.achievement})`).join(' / ') || '단원 정보 없음';

  const completed = writing.revisions.filter((r) => r.feedback);
  const compareRows = completed
    .map((r) => {
      const s = r.feedback!.scores;
      return `<tr><td>${r.index}회</td><td>${s.spelling}</td><td>${s.structure}</td><td>${s.context}</td><td>${s.expression}</td></tr>`;
    })
    .join('');

  return `
  <div style="font-family: 'Pretendard Variable','Pretendard',system-ui,sans-serif; color:#222; padding:32px; box-sizing:border-box; width:730px;">
    <h1 style="font-size:22px; margin:0 0 4px 0; letter-spacing:-0.01em;">Writing Coach — ${meta.emoji} ${escapeHtml(writing.type)}</h1>
    <div style="font-size:11px; color:#666; margin-bottom:18px;">
      ${writing.topic ? `주제: ${escapeHtml(writing.topic)} · ` : ''}
      작성: ${new Date(writing.createdAt).toLocaleString('ko-KR')} · 회차 ${last?.index ?? 1}/5
    </div>
    <div style="font-size:11px; color:#444; margin-bottom:18px; padding:8px 12px; background:#fef9f3; border-radius:8px;">
      관련 단원 (22개정): ${escapeHtml(unitText)}
    </div>

    <h2 style="font-size:14px; margin:14px 0 6px 0;">학생 글 (최종)</h2>
    <div style="font-size:13px; line-height:1.7; padding:12px 14px; background:#faf7f2; border-radius:8px; white-space:pre-wrap;">${escapeHtml(last?.text ?? '')}</div>

    ${
      fb
        ? `
      <h2 style="font-size:14px; margin:18px 0 6px 0;">잘한 점</h2>
      <div style="font-size:13px; padding:10px 12px; background:#eaf6ed; border-radius:8px;">🌟 ${escapeHtml(fb.praise)}</div>

      <h2 style="font-size:14px; margin:18px 0 6px 0;">4영역 등급</h2>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">영역</th>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">등급</th>
          </tr>
        </thead>
        <tbody>
          ${(['spelling', 'structure', 'context', 'expression'] as FeedbackArea[])
            .map(
              (a) => `
              <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #eee;">${AREA_LABEL[a]}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #eee;">${fb.scores[a]}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>

      ${
        fb.inlineMarks.length > 0
          ? `
          <h2 style="font-size:14px; margin:18px 0 6px 0;">고치면 더 좋을 부분</h2>
          <ul style="font-size:12px; padding-left:18px; line-height:1.6;">
            ${fb.inlineMarks
              .map(
                (m) => `<li>
                <strong style="color:#333;">${AREA_LABEL[m.area]}</strong>
                — "${escapeHtml(m.snippet)}": ${escapeHtml(m.comment)}
              </li>`,
              )
              .join('')}
          </ul>`
          : ''
      }

      <h2 style="font-size:14px; margin:18px 0 6px 0;">격려</h2>
      <div style="font-size:13px; padding:10px 12px; background:#fdf3e7; border-radius:8px;">💌 ${escapeHtml(fb.encouragement)}</div>
    `
        : ''
    }

    ${
      completed.length >= 2
        ? `
      <h2 style="font-size:14px; margin:18px 0 6px 0;">회차별 등급 변화</h2>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">회차</th>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">맞춤법</th>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">구조</th>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">맥락</th>
            <th style="text-align:left; padding:6px 8px; background:#f1ece2;">표현</th>
          </tr>
        </thead>
        <tbody>${compareRows}</tbody>
      </table>`
        : ''
    }

    <p style="font-size:10px; color:#888; margin-top:24px;">
      ※ 100점 만점 점수가 아니라 4단계(잘함·괜찮음·노력·다시) 단어로 표시했어요. Writing Coach
    </p>
  </div>`;
}

export async function exportFeedbackPdf(writing: Writing): Promise<void> {
  // Pretendard 폰트 로딩 보장
  if (document.fonts && 'ready' in document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const container = document.createElement('div');
  container.setAttribute('data-pdf-root', 'true');
  container.style.cssText =
    'position:fixed; left:-10000px; top:0; width:730px; background:#ffffff; color:#222; z-index:-1;';
  container.innerHTML = buildPrintableHtml(writing);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
    } else {
      // 페이지 분할: 같은 이미지를 음수 y로 반복 배치하며 새 페이지 추가
      let position = 0;
      let heightLeft = imgH;
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH; // 음수
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
    }

    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    pdf.save(`글쓰기_${writing.type}_${yyyymmdd}.pdf`);
  } finally {
    container.remove();
  }
}
