import {
	clampBlurStrength,
	clampRevealCount,
	clampScreenTintBrightness,
	clampScreenTintHue,
	clampScreenTintIntensity,
	DEFAULT_SETTINGS,
	isContentHandlingMode,
	isMaskMode,
	isRevealMode,
	type ContentHandlingMode,
	type TextHiderPluginSettings,
} from "./types";

type SavedSettings = Partial<TextHiderPluginSettings> & {
	excludeHeaders?: unknown;
	excludeCallouts?: unknown;
	hideCallouts?: unknown;
};

function asRecord(value: unknown): SavedSettings {
	return value !== null && typeof value === "object" ? value : {};
}

function validNumber(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function contentMode(value: unknown, fallback: ContentHandlingMode): ContentHandlingMode {
	return isContentHandlingMode(value) ? value : fallback;
}

export function normalizeSettings(raw: unknown): TextHiderPluginSettings {
	const saved = asRecord(raw);
	const calloutMode = isContentHandlingMode(saved.calloutMode)
		? saved.calloutMode
		: saved.hideCallouts === true
			? "hide"
			: saved.excludeCallouts === true
				? "exclude"
				: DEFAULT_SETTINGS.calloutMode;
	const headerMode = isContentHandlingMode(saved.headerMode)
		? saved.headerMode
		: saved.excludeHeaders === false
			? "mask"
			: DEFAULT_SETTINGS.headerMode;

	return {
		enabled: typeof saved.enabled === "boolean" ? saved.enabled : DEFAULT_SETTINGS.enabled,
		maskMode: isMaskMode(saved.maskMode) ? saved.maskMode : DEFAULT_SETTINGS.maskMode,
		revealMode: isRevealMode(saved.revealMode) ? saved.revealMode : DEFAULT_SETTINGS.revealMode,
		revealCount: clampRevealCount(Math.round(validNumber(saved.revealCount, DEFAULT_SETTINGS.revealCount))),
		blurStrength: clampBlurStrength(validNumber(saved.blurStrength, DEFAULT_SETTINGS.blurStrength)),
		headerMode,
		calloutMode,
		imageMode: contentMode(saved.imageMode, DEFAULT_SETTINGS.imageMode),
		titleMode: contentMode(saved.titleMode, DEFAULT_SETTINGS.titleMode),
		revealSelection: typeof saved.revealSelection === "boolean"
			? saved.revealSelection
			: DEFAULT_SETTINGS.revealSelection,
		maskReadingView: typeof saved.maskReadingView === "boolean"
			? saved.maskReadingView
			: DEFAULT_SETTINGS.maskReadingView,
		screenTintEnabled: typeof saved.screenTintEnabled === "boolean"
			? saved.screenTintEnabled
			: DEFAULT_SETTINGS.screenTintEnabled,
		screenTintBrightness: clampScreenTintBrightness(
			Math.round(validNumber(saved.screenTintBrightness, DEFAULT_SETTINGS.screenTintBrightness)),
		),
		screenTintHue: clampScreenTintHue(Math.round(validNumber(saved.screenTintHue, DEFAULT_SETTINGS.screenTintHue))),
		screenTintIntensity: clampScreenTintIntensity(
			Math.round(validNumber(saved.screenTintIntensity, DEFAULT_SETTINGS.screenTintIntensity)),
		),
		showStatusBar: typeof saved.showStatusBar === "boolean" ? saved.showStatusBar : DEFAULT_SETTINGS.showStatusBar,
	};
}
