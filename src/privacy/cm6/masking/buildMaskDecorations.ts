import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type { TextHiderPluginSettings } from "../../../settings";
import { computeRevealRanges, subtractRanges, mergeRanges, type Range } from "./ranges";
import { isHeaderLine } from "./headers";

export function buildMaskDecorations(
	view: EditorView,
	enabled: boolean,
	settings: TextHiderPluginSettings
) {
	if (!enabled) return Decoration.none;

	const builder = new RangeSetBuilder<Decoration>();
	const state = view.state;

	// 1) Cursor reveal range
	const cursorReveal = computeRevealRanges(state, settings.revealMode);

	// 2) Selection reveal ranges (optional)
	const selectionReveal: Range[] = settings.revealSelection
		? state.selection.ranges
				.filter((r) => !r.empty)
				.map((r) => ({ from: Math.min(r.from, r.to), to: Math.max(r.from, r.to) }))
		: [];

	const revealRanges = mergeRanges([...cursorReveal, ...selectionReveal]);

	// 3) Build masking per visible line
	for (const vr of view.visibleRanges) {
		let pos = vr.from;

		while (pos <= vr.to) {
			const line = state.doc.lineAt(pos);

			if (line.from > vr.to) break;

			const excludeThisLine = settings.excludeHeaders && isHeaderLine(line.text);

			if (!excludeThisLine) {
				const lineRange: Range = { from: line.from, to: line.to };

				const revealInLine = revealRanges
					.filter((r) => r.to > lineRange.from && r.from < lineRange.to)
					.map((r) => ({
						from: Math.max(r.from, lineRange.from),
						to: Math.min(r.to, lineRange.to),
					}));

				const maskSegments = subtractRanges([lineRange], revealInLine);

				const cls =
					settings.maskMode === "hide"
						? "privacy-mask-hide"
						: settings.maskMode === "password"
							? "privacy-mask-password"
							: "privacy-mask-blur";

				for (const seg of maskSegments) {
					if (seg.to <= seg.from) continue;
					builder.add(seg.from, seg.to, Decoration.mark({ class: cls }));
				}
			}

			pos = line.to + 1;
			if (pos === line.from) break;
		}
	}

	return builder.finish();
}
