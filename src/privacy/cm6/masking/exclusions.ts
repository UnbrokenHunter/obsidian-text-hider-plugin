import type { EditorState } from "@codemirror/state";
import type { Range } from "./ranges";
import { isHeaderLine } from "./headers";

export function computeExcludedRanges(state: EditorState, opts: { excludeFrontmatter: boolean; excludeTitleLine: boolean }): Range[] {
  const out: Range[] = [];

  if (opts.excludeFrontmatter) {
    out.push(...getFrontmatterRanges(state));
  }

  if (opts.excludeTitleLine) {
    const firstLine = state.doc.line(1);
    if (isHeaderLine(firstLine.text)) {
      out.push({ from: firstLine.from, to: firstLine.to });
    }
  }

  return out;
}

function getFrontmatterRanges(state: EditorState): Range[] {
  const ranges: Range[] = [];

  if (state.doc.lines < 2) return ranges;

  const first = state.doc.line(1).text.trim();
  if (first !== "---") return ranges;

  // Frontmatter starts at line 1, ends at next line that's exactly --- or ...
  for (let lineNo = 2; lineNo <= state.doc.lines; lineNo++) {
    const line = state.doc.line(lineNo);
    const t = line.text.trim();
    if (t === "---" || t === "...") {
      // Include both delimiter lines
      const start = state.doc.line(1);
      ranges.push({ from: start.from, to: line.to });
      break;
    }
  }

  return ranges;
}
