import type { EditorState } from "@codemirror/state";
import type { RevealMode } from "../../../settings";

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
  revealMode: RevealMode,
  revealCount = 1
): Range[] {
  const count = Math.max(1, Math.floor(revealCount));
  return mergeRanges(state.selection.ranges.flatMap((range) => computeRevealRange(state, range.head, revealMode, count)));
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
  revealMode: RevealMode,
  revealCount: number
): Range[] {
  if (revealMode === "letter") {
    return getRangeWindow(getCharacterRanges(state.doc.toString()), pos, revealCount);
  }

  const text = state.doc.toString();
  const units =
    revealMode === "sentence"
      ? getSentenceRanges(text)
      : revealMode === "line"
        ? getLineRanges(state)
        : getWordRanges(text);
  return getRangeWindow(units, pos, revealCount);
}

function getRangeWindow(units: Range[], pos: number, count: number): Range[] {
  const focusedIndex = units.findIndex((unit) => pos >= unit.from && pos < unit.to);
  const index = focusedIndex >= 0 ? focusedIndex : pos === units[units.length - 1]?.to ? units.length - 1 : -1;
  if (index < 0) return [];

  const end = Math.min(units.length, index + count);
  const start = Math.max(0, end - count);
  const first = units[start];
  const last = units[end - 1];
  return first && last ? [{ from: first.from, to: last.to }] : [];
}

function getCharacterRanges(text: string): Range[] {
  return Array.from({ length: text.length }, (_, index) => ({ from: index, to: index + 1 }));
}

function getLineRanges(state: EditorState): Range[] {
  return Array.from({ length: state.doc.lines }, (_, index) => {
    const line = state.doc.line(index + 1);
    return { from: line.from, to: line.to };
  });
}

function getWordRanges(text: string): Range[] {
  const ranges: Range[] = [];
  let start = -1;

  for (let index = 0; index <= text.length; index++) {
    if (index < text.length && isWordChar(text.charAt(index))) {
      if (start < 0) start = index;
      continue;
    }

    if (start >= 0) {
      ranges.push({ from: start, to: index });
      start = -1;
    }
  }

  return ranges;
}

function getSentenceRanges(text: string): Range[] {
  const ranges: Range[] = [];
  let start = findNextNonWhitespace(text, 0);

  while (start >= 0) {
    let end = start;
    while (end < text.length && !isSentenceEnd(text.charAt(end))) end++;

    if (end < text.length) {
      end++;
      while (end < text.length && isClosingPunctuation(text.charAt(end))) end++;
    }

    ranges.push({ from: start, to: end });
    start = findNextNonWhitespace(text, end);
  }

  return ranges;
}

function findNextNonWhitespace(text: string, from: number): number {
  for (let index = from; index < text.length; index++) {
    if (!/\s/u.test(text.charAt(index))) return index;
  }
  return -1;
}

function isSentenceEnd(character: string): boolean {
  return /[.!?\u2026]/u.test(character);
}

function isClosingPunctuation(character: string): boolean {
  return /["'\u2019\u201d)\]}]/u.test(character);
}

function isWordChar(character: string): boolean {
  return /[\p{L}\p{N}\p{M}\p{Pc}'\u2019]/u.test(character);
}