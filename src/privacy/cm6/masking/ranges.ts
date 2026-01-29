import type { EditorState } from "@codemirror/state";

export type Range = { from: number; to: number };

export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges
    .filter((r) => r.to > r.from)
    .slice()
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const merged: Range[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (!last || r.from > last.to) merged.push({ ...r });
    else last.to = Math.max(last.to, r.to);
  }
  return merged;
}

export function subtractRanges(base: Range[], subtract: Range[]): Range[] {
  const b = mergeRanges(base);
  const s = mergeRanges(subtract);

  const out: Range[] = [];
  for (const br of b) {
    let cursor = br.from;

    for (const sr of s) {
      if (sr.to <= cursor) continue;
      if (sr.from >= br.to) break;

      const start = Math.max(cursor, br.from);
      const end = Math.min(sr.from, br.to);
      if (end > start) out.push({ from: start, to: end });

      cursor = Math.max(cursor, sr.to);
      if (cursor >= br.to) break;
    }

    if (cursor < br.to) out.push({ from: cursor, to: br.to });
  }

  return out;
}

export function computeRevealRanges(state: EditorState, revealMode: "word" | "letter" | "none"): Range[] {
  if (revealMode === "none") return [];

  // Use primary cursor (head) for now; later you can support multi-cursor.
  const pos = state.selection.main.head;

  if (revealMode === "letter") {
    // Reveal character "under" cursor if possible, else previous
    if (pos < state.doc.length) return [{ from: pos, to: pos + 1 }];
    if (pos > 0) return [{ from: pos - 1, to: pos }];
    return [];
  }

  // revealMode === "word"
  const line = state.doc.lineAt(pos);
  const idx = pos - line.from;

  const isWordChar = (ch: string) => /[A-Za-z0-9_]/.test(ch);

  let left = idx;
  while (left > 0 && isWordChar(line.text.charAt(left - 1))) left--;

  let right = idx;
  while (right < line.text.length && isWordChar(line.text.charAt(right))) right++;

  if (right <= left) {
    // No word char at cursor — reveal nothing
    return [];
  }

  return [{ from: line.from + left, to: line.from + right }];
}
