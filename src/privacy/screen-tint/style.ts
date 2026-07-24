import type { TextHiderPluginSettings } from "../../settings/types";

const MAX_BRIGHTNESS_OPACITY = 0.45;
const MAX_HUE_OPACITY = 0.25;

export function shouldShowScreenTint(enabled: boolean, settings: TextHiderPluginSettings): boolean {
	return enabled && settings.screenTintEnabled;
}

export function buildScreenTintBackground(settings: TextHiderPluginSettings): string {
	const brightnessChannel = settings.screenTintBrightness < 0 ? 0 : 255;
	const brightnessOpacity = Math.min(
		MAX_BRIGHTNESS_OPACITY,
		Math.abs(settings.screenTintBrightness) / 100,
	);
	const hueOpacity = Math.min(MAX_HUE_OPACITY, settings.screenTintIntensity / 100);

	const tintLayer = `hsla(${settings.screenTintHue}, 100%, 50%, ${hueOpacity})`;
	const brightnessLayer = `rgba(${brightnessChannel}, ${brightnessChannel}, ${brightnessChannel}, ${brightnessOpacity})`;
	return `linear-gradient(${tintLayer}, ${tintLayer}), linear-gradient(${brightnessLayer}, ${brightnessLayer})`;
}