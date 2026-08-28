/** Verbatim, complete files from MalikAhed/stockthink. */
export const STOCKTHINK_SOURCE_FILES = Object.freeze({
  "summary.ts": `/**
 * Report summary card: per-player accuracy, estimated rating and the
 * classification-count table (chess.com Game Review layout).
 */
import type { AnnotatedReport } from '@backend/analyze';
import { badgeHtml, CLASS_COLORS, CLASS_LABELS, CLASS_ORDER } from './badges';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderSummary(el: HTMLElement, report: AnnotatedReport): void {
  const w = report.players.white;
  const b = report.players.black;
  const white = esc(report.headers.White ?? 'White');
  const black = esc(report.headers.Black ?? 'Black');

  const rows = CLASS_ORDER.map(
    c => \`
      <tr class="cnt-row\${w.counts[c] + b.counts[c] === 0 ? ' zero' : ''}">
        <td class="cnt-w">\${w.counts[c] || ''}</td>
        <td class="cnt-label" style="color:\${CLASS_COLORS[c]}">
          \${badgeHtml(c)}
          \${CLASS_LABELS[c]}
        </td>
        <td class="cnt-b">\${b.counts[c] || ''}</td>
      </tr>\`,
  ).join('');

  el.innerHTML = \`
    <div class="summary-card">
      <div class="acc-grid">
        <div class="acc-col">
          <div class="player-name">\${white}</div>
          <div class="acc-box white-box">\${w.accuracy.toFixed(1)}</div>
          <div class="est-elo">est. \${w.estimatedElo}</div>
        </div>
        <div class="acc-title">Accuracy</div>
        <div class="acc-col">
          <div class="player-name">\${black}</div>
          <div class="acc-box black-box">\${b.accuracy.toFixed(1)}</div>
          <div class="est-elo">est. \${b.estimatedElo}</div>
        </div>
      </div>
      \${report.opening ? \`<div class="opening-name">\${esc(report.opening)}</div>\` : ''}
      <table class="counts">\${rows}</table>
    </div>\`;
}`,
  "graph.ts": `/**
 * Eval graph: SVG area chart of White's win% per ply (lichess plots win
 * chance, not centipawns — "Plot winchance because logarithmic").
 */
import type { AnnotatedMove } from '@backend/analyze';
import { winPercent } from '@backend/analysis/winprob';

const W = 600;
const H = 110;

export function renderGraph(
  el: HTMLElement,
  moves: AnnotatedMove[],
  currentPly: number,
  onSeek: (ply: number) => void,
): void {
  // win% sequence: start position + after every ply (white POV)
  const wins = [moves.length ? winPercent(moves[0].evalBefore) : 50];
  for (const m of moves) wins.push(m.winPercentAfter);

  const x = (i: number) => (i / (wins.length - 1)) * W;
  const y = (w: number) => H - (w / 100) * H;
  const pts = wins.map((w, i) => \`\${x(i).toFixed(1)},\${y(w).toFixed(1)}\`);

  // big-swing markers (≥20 win% lost) until classification returns
  const dots = moves
    .map((m, i) =>
      m.winDrop >= 20
        ? \`<circle cx="\${x(i + 1).toFixed(1)}" cy="\${y(wins[i + 1]).toFixed(1)}" r="4"\` +
          \` fill="#fa412d" stroke="#262421" stroke-width="1.5"/>\`
        : '',
    )
    .join('');

  const cursor =
    currentPly > 0
      ? \`<line x1="\${x(currentPly).toFixed(1)}" y1="0" x2="\${x(currentPly).toFixed(1)}"\` +
        \` y2="\${H}" stroke="#f4bf44" stroke-width="1.5"/>\`
      : '';

  el.innerHTML =
    \`<svg viewBox="0 0 \${W} \${H}" class="eval-graph" role="img" aria-label="evaluation graph">\` +
    \`<rect width="\${W}" height="\${H}" fill="#1f1d1b"/>\` +
    \`<path d="M0,\${H} L\${pts.join(' L')} L\${W},\${H} Z" fill="#e8e6e3" opacity="0.9"/>\` +
    \`<line x1="0" y1="\${H / 2}" x2="\${W}" y2="\${H / 2}" stroke="#777" stroke-width="0.6" stroke-dasharray="3 3"/>\` +
    cursor + dots + \`</svg>\`;

  const svg = el.querySelector('svg')!;
  svg.addEventListener('click', e => {
    const rect = svg.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(moves.length, Math.round(frac * (wins.length - 1)))));
  });
}`,
  "package.json": `{
  "name": "stockthink",
  "private": true,
  "version": "0.1.0",
  "description": "Free, fully client-side chess game analysis — chess.com-style Game Review powered by Stockfish in your browser.",
  "type": "module",
  "license": "GPL-3.0-or-later",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "eval": "vite-node self-improvement/eval/score.ts --"
  },
  "dependencies": {
    "@mlc-ai/web-llm": "^0.2.84",
    "chessground": "^9.1.1",
    "chessops": "^0.14.2",
    "gsap": "^3.15.0",
    "three": "^0.160.1"
  },
  "devDependencies": {
    "@types/node": "^25.9.2",
    "@types/three": "^0.160.0",
    "ffmpeg-static": "^5.3.0",
    "happy-dom": "^20.10.2",
    "typescript": "^5.5.4",
    "vite": "^5.4.11",
    "vite-plugin-checker": "^0.14.1",
    "vitest": "^1.6.0"
  }
}`,
});
