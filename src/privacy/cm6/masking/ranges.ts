import type { EditorState } from "@codemirror/state";

export type Range = { from: number; to: number };

export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges
    .filter((range) => range.to > range.from)
    .slice()
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const merged: Range[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (!last || range.from > last.to) merged.push({ ...range });
    else last.to = Math.max(last.to, range.to);
  }
  return merged;
}

export function subtractRanges(base: Range[], subtract: Range[]): Range[] {
  const mergedBase = mergeRanges(base);
  const mergedSubtract = mergeRanges(subtract);

  const out: Range[] = [];
  for (const baseRange of mergedBase) {
    let cursor = baseRange.from;

    for (const subtractRange of mergedSubtract) {
      if (subtractRange.to <= cursor) continue;
      if (subtractRange.from >= baseRange.to) break;

      const start = Math.max(cursor, baseRange.from);
      const end = Math.min(subtractRange.from, baseRange.to);
      if (end > start) out.push({ from: start, to: end });

      cursor = Math.max(cursor, subtractRange.to);
      if (cursor >= baseRange.to) break;
    }

    if (cursor < baseRange.to) out.push({ from: cursor, to: baseRange.to });
  }

  return out;
}

export function computeRevealRanges(
  state: EditorState,
  revealMode: "word" | "letter"
): Range[] {
  return mergeRanges(state.selection.ranges.flatMap((range) => computeRevealRange(state, range.head, revealMode)));
}

export function computeCurrentLineRanges(state: EditorState): Range[] {
  return mergeRanges(
    state.selection.ranges.map((range) => {
      const line = state.doc.lineAt(range.head);
      return { from: line.from, to: line.to };
    })
  );
}

function computeRevealRange(
  state: EditorState,
  pos: number,
  revealMode: "word" | "letter"
): Range[] {
  if (revealMode === "letter") {
    if (pos < state.doc.length) return [{ from: pos, to: pos + 1 }];
    if (pos > 0) return [{ from: pos - 1, to: pos }];
    return [];
  }

  const line = state.doc.lineAt(pos);
  const index = pos - line.from;

  let left = index;
  while (left > 0 && isWordChar(line.text.charAt(left - 1))) left--;

  let right = index;
  while (right < line.text.length && isWordChar(line.text.charAt(right))) right++;

  if (right <= left) return [];

  return [{ from: line.from + left, to: line.from + right }];
}

function isWordChar(character: string): boolean {
  return /[\p{L}\p{N}\p{M}\p{Pc}'\u2019]/u.test(character);
}