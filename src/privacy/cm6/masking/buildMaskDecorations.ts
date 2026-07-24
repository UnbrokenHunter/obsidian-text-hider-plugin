import type { EditorView } from "@codemirror/view";
import { Decoration } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type { TextHiderPluginSettings } from "../../../settings";
import { computeRevealRanges, subtractRanges, mergeRanges, type Range } from "./ranges";
import { isCalloutBlockLine, isHeaderLine } from "./headers";

export function buildMaskDecorations(
	view: EditorView,
	enabled: boolean,
	settings: TextHiderPluginSettings
) {
	if (!enabled) return Decoration.none;

	const builder = new RangeSetBuilder<Decoration>();
	const state = view.state;

	const cursorReveal = computeRevealRanges(state, settings.revealMode, settings.revealCount);
	const selectionReveal: Range[] = settings.revealSelection
		? state.selection.ranges
				.filter((range) => !range.empty)
				.map((range) => ({ from: Math.min(range.from, range.to), to: Math.max(range.from, range.to) }))
		: [];
	const revealRanges = mergeRanges([...cursorReveal, ...selectionReveal]);

	for (const visibleRange of view.visibleRanges) {
		let pos = visibleRange.from;

		while (pos <= visibleRange.to) {
			const line = state.doc.lineAt(pos);
			if (line.from > visibleRange.to) break;

			const isCalloutLine = isCalloutBlockLine(state.doc, line.number);
			const hideThisLine = settings.calloutMode === "hide" && isCalloutLine;
			const excludeThisLine =
				(settings.excludeHeaders && isHeaderLine(line.text)) ||
				(settings.calloutMode === "exclude" && isCalloutLine);

			if (hideThisLine) {
				builder.add(line.from, line.from, Decoration.line({ class: "privacy-callout-hidden" }));
			} else if (!excludeThisLine) {
				const lineRange: Range = { from: line.from, to: line.to };
				const revealInLine = revealRanges
					.filter((range) => range.to > lineRange.from && range.from < lineRange.to)
					.map((range) => ({
						from: Math.max(range.from, lineRange.from),
						to: Math.min(range.to, lineRange.to),
					}));
				const maskSegments = subtractRanges([lineRange], revealInLine);
				const className = getMaskClass(settings.maskMode);

				for (const segment of maskSegments) {
					if (segment.to > segment.from) {
						builder.add(segment.from, segment.to, Decoration.mark({ class: className }));
					}
				}
			}

			pos = line.to + 1;
			if (pos === line.from) break;
		}
	}

	return builder.finish();
}

function getMaskClass(maskMode: TextHiderPluginSettings["maskMode"]): string {
	if (maskMode === "hide") return "privacy-mask-hide";
	if (maskMode === "password") return "privacy-mask-password";
	return "privacy-mask-blur";
}