import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
import type { MyPluginSettings } from "../../../settings";
import { MaskWidget } from "./widgets";
import { computeRevealRanges, subtractRanges, mergeRanges, type Range } from "./ranges";
import { isHeaderLine } from "./headers";
import { computeExcludedRanges } from "./exclusions";

export function buildMaskDecorations(view: EditorView, enabled: boolean, settings: MyPluginSettings) {
  if (!enabled) return Decoration.none;

  const builder = new (class {
    decos: { from: number; to: number; deco: any }[] = [];
    add(from: number, to: number, deco: any) {
      this.decos.push({ from, to, deco });
    }
    finish() {
      // @codemirror/view expects Range<Decoration>; Obsidian bundles RangeSetBuilder,
      // but a simple build works via Decoration.set([...]) too.
      return Decoration.set(this.decos.map((d) => d.deco.range(d.from, d.to)), true);
    }
  })();

  const state = view.state;

  // 1) Compute reveal ranges (cursor letter/word/none)
  const cursorReveal = computeRevealRanges(state, settings.revealMode);

  // 2) Compute selection reveal ranges (if enabled)
  const selectionReveal: Range[] = settings.revealSelection
    ? state.selection.ranges
        .filter((r) => !r.empty)
        .map((r) => ({ from: Math.min(r.from, r.to), to: Math.max(r.from, r.to) }))
    : [];

  const excluded = computeExcludedRanges(state, {
    excludeFrontmatter: settings.excludeFrontmatter,
    excludeTitleLine: settings.excludeTitleLine,
  });

  const revealRanges = mergeRanges([...cursorReveal, ...selectionReveal, ...excluded]);

  // 3) Build masking per visible line
  for (const vr of view.visibleRanges) {
    let pos = vr.from;

    while (pos <= vr.to) {
      const line = state.doc.lineAt(pos);

      // stop if we've moved past viewport
      if (line.from > vr.to) break;

      const excludeThisLine = settings.excludeHeaders && isHeaderLine(line.text);

      if (!excludeThisLine) {
        // Mask the whole line text (not including newline)
        const lineRange: Range = { from: line.from, to: line.to };

        // Subtract reveal ranges that overlap this line
        const revealInLine = revealRanges
          .filter((r) => r.to > lineRange.from && r.from < lineRange.to)
          .map((r) => ({
            from: Math.max(r.from, lineRange.from),
            to: Math.min(r.to, lineRange.to),
          }));

        const maskSegments = subtractRanges([lineRange], revealInLine);

        for (const seg of maskSegments) {
          if (seg.to <= seg.from) continue;

          const length = seg.to - seg.from;
          const deco = Decoration.replace({
            widget: new MaskWidget(length, settings.maskMode),
            inclusive: false,
          });
          builder.add(seg.from, seg.to, deco);
        }
      }

      // advance to next line
      pos = line.to + 1;
      if (pos === line.from) break; // safety
    }
  }

  return builder.finish();
}
