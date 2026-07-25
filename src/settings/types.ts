export type MaskMode = "hide" | "password" | "blur";
export type RevealMode = "word" | "letter" | "sentence" | "line";
export type ContentHandlingMode = "mask" | "exclude" | "hide";

export interface TextHiderPluginSettings {
	enabled: boolean;
	maskMode: MaskMode;
	revealMode: RevealMode;
	revealCount: number;
	blurStrength: number;
	headerMode: ContentHandlingMode;
	calloutMode: ContentHandlingMode;
	imageMode: ContentHandlingMode;
	titleMode: ContentHandlingMode;
	revealSelection: boolean;
	maskReadingView: boolean;
	screenTintEnabled: boolean;
	screenTintBrightness: number;
	screenTintHue: number;
	screenTintIntensity: number;
	showStatusBar: boolean;
}

export const DEFAULT_SETTINGS: TextHiderPluginSettings = {
	enabled: false,
	maskMode: "blur",
	revealMode: "word",
	revealCount: 1,
	blurStrength: 6,
	headerMode: "mask",
	calloutMode: "mask",
	imageMode: "mask",
	titleMode: "exclude",
	revealSelection: true,
	maskReadingView: true,
	screenTintEnabled: false,
	screenTintBrightness: -15,
	screenTintHue: 0,
	screenTintIntensity: 0,
	showStatusBar: true,
};

export const MIN_BLUR_STRENGTH = 1;
export const MAX_BLUR_STRENGTH = 16;
export const MIN_REVEAL_COUNT = 1;
export const MAX_REVEAL_COUNT = 100;
export const MIN_SCREEN_TINT_BRIGHTNESS = -75;
export const MAX_SCREEN_TINT_BRIGHTNESS = 35;
export const MIN_SCREEN_TINT_HUE = 0;
export const MAX_SCREEN_TINT_HUE = 360;
export const MIN_SCREEN_TINT_INTENSITY = 0;
export const MAX_SCREEN_TINT_INTENSITY = 35;

export function isMaskMode(value: unknown): value is MaskMode {
	return value === "hide" || value === "password" || value === "blur";
}

export function isRevealMode(value: unknown): value is RevealMode {
	return value === "word" || value === "letter" || value === "sentence" || value === "line";
}

export function isContentHandlingMode(value: unknown): value is ContentHandlingMode {
	return value === "mask" || value === "exclude" || value === "hide";
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}

export function clampBlurStrength(value: number): number {
	return clamp(value, MIN_BLUR_STRENGTH, MAX_BLUR_STRENGTH);
}

export function clampRevealCount(value: number): number {
	return clamp(value, MIN_REVEAL_COUNT, MAX_REVEAL_COUNT);
}

export function clampScreenTintBrightness(value: number): number {
	return clamp(value, MIN_SCREEN_TINT_BRIGHTNESS, MAX_SCREEN_TINT_BRIGHTNESS);
}

export function clampScreenTintHue(value: number): number {
	return clamp(value, MIN_SCREEN_TINT_HUE, MAX_SCREEN_TINT_HUE);
}

export function clampScreenTintIntensity(value: number): number {
	return clamp(value, MIN_SCREEN_TINT_INTENSITY, MAX_SCREEN_TINT_INTENSITY);
}