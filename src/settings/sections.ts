import type { Setting, SettingDefinitionRender } from "obsidian";
import type TextHiderPlugin from "../main";
import {
	clampRevealCount,
	MAX_BLUR_STRENGTH,
	MAX_REVEAL_COUNT,
	MAX_SCREEN_TINT_BRIGHTNESS,
	MAX_SCREEN_TINT_HUE,
	MAX_SCREEN_TINT_INTENSITY,
	MIN_BLUR_STRENGTH,
	MIN_SCREEN_TINT_BRIGHTNESS,
	MIN_SCREEN_TINT_HUE,
	MIN_SCREEN_TINT_INTENSITY,
	type TextHiderPluginSettings,
} from "./types";

export interface SettingsRow extends SettingDefinitionRender {
	render: (setting: Setting) => void;
}

export interface SettingsSection {
	heading?: string;
	items: SettingsRow[];
}

type ToggleKey = "enabled" | "revealSelection" | "screenTintEnabled" | "maskReadingView" | "showStatusBar";
type DropdownKey = "maskMode" | "revealMode" | "titleMode" | "headerMode" | "calloutMode" | "imageMode";
type SliderKey = "blurStrength" | "screenTintBrightness" | "screenTintHue" | "screenTintIntensity";

// Both settings interfaces use these callbacks to keep saving and live updates identical.
export function createSettingsSections(plugin: TextHiderPlugin, refreshVisibility: () => void): SettingsSection[] {
	async function saveAndApply(): Promise<void> {
		await plugin.saveSettings();
		plugin.notifySettingsChanged();
	}

	function toggle(key: ToggleKey, name: string, desc: string): SettingsRow {
		return {
			name, desc,
			render: (setting) => {
				setting.addToggle((control) => control.setValue(plugin.settings[key]).onChange(async (value) => {
					plugin.settings[key] = value;
					refreshVisibility();
					await saveAndApply();
				}));
			},
		};
	}

	function dropdown<K extends DropdownKey>(key: K, name: string, desc: string,
		options: Record<TextHiderPluginSettings[K], string>): SettingsRow {
		return {
			name, desc,
			render: (setting) => {
				setting.addDropdown((control) => control.addOptions(options).setValue(plugin.settings[key]).onChange(async (value) => {
					plugin.settings[key] = value as TextHiderPluginSettings[K];
					refreshVisibility();
					await saveAndApply();
				}));
			},
		};
	}

	function slider(key: SliderKey, name: string, desc: string, minimum: number, maximum: number,
		visible: () => boolean, liveTint = false): SettingsRow {
		return {
			name, desc, visible,
			render: (setting) => {
				setting.addSlider((control) => {
					control.setLimits(minimum, maximum, 1).setValue(plugin.settings[key]);
					// Keep tooltips on sliders without the newer inline-value API.
					if (!("setDisplayFormat" in control)) control.setDynamicTooltip();
					if (liveTint) {
						control.sliderEl.addEventListener("input", () => {
							plugin.settings[key] = Number(control.sliderEl.value);
							plugin.updateScreenTint();
						});
						control.sliderEl.addEventListener("change", () => void plugin.saveSettings());
					} else {
						control.onChange(async (value) => {
							plugin.settings[key] = value;
							await saveAndApply();
						});
					}
				});
			},
		};
	}

	const contentOptions = { exclude: "Ignore", mask: "Mask", hide: "Hide" };
	const tintVisible = () => plugin.settings.screenTintEnabled;
	return [
		{ items: [toggle("enabled", "Enable text hider",
			"Turn masking on or off. You can assign hotkeys to the toggle, enable, and disable commands.")] },
		{
			heading: "Masking & reveal",
			items: [
				dropdown("maskMode", "Mask mode",
					"How hidden text is shown. Hide is cleanest, blur is softer, and password can vary by theme.",
					{ hide: "Hide", blur: "Blur", password: "Password" }),
				slider("blurStrength", "Blur strength", "How strongly text is blurred when blur mode is selected.",
					MIN_BLUR_STRENGTH, MAX_BLUR_STRENGTH, () => plugin.settings.maskMode === "blur"),
				dropdown("revealMode", "Reveal mode", "What stays readable at each cursor.",
					{ word: "Words", letter: "Characters", sentence: "Sentences", line: "Lines" }),
				{
					name: "Reveal amount",
					desc: `How many adjacent characters, words, sentences, or lines to reveal (1-${MAX_REVEAL_COUNT}).`,
					render: (setting) => {
						setting.addText((control) => control.setValue(String(plugin.settings.revealCount))
							.setPlaceholder("1").onChange(async (value) => {
								const count = Number(value);
								if (!Number.isInteger(count)) return;
								plugin.settings.revealCount = clampRevealCount(count);
								await saveAndApply();
							}));
					},
				},
				toggle("revealSelection", "Reveal selected text", "Selected text becomes visible while selected."),
			],
		},
		{
			heading: "Exceptions & behavior",
			items: [
				dropdown("titleMode", "Note title handling", "Choose how privacy mode treats the inline note title.", contentOptions),
				dropdown("headerMode", "Header handling", "Choose how privacy mode treats Markdown headers.", contentOptions),
				dropdown("calloutMode", "Callout handling", "Choose how privacy mode treats Markdown callouts.", contentOptions),
				dropdown("imageMode", "Image handling", "Choose how privacy mode treats note images.", contentOptions),
			],
		},
		{
			heading: "Screen tint",
			items: [
				toggle("screenTintEnabled", "Enable screen tint", "Tint the entire Obsidian workspace while privacy mode is on."),
				slider("screenTintBrightness", "Tint brightness", "Make the workspace darker or lighter.",
					MIN_SCREEN_TINT_BRIGHTNESS, MAX_SCREEN_TINT_BRIGHTNESS, tintVisible, true),
				slider("screenTintHue", "Tint hue", "Choose the tint color.",
					MIN_SCREEN_TINT_HUE, MAX_SCREEN_TINT_HUE, tintVisible, true),
				slider("screenTintIntensity", "Tint intensity", "Set the strength of the tint color.",
					MIN_SCREEN_TINT_INTENSITY, MAX_SCREEN_TINT_INTENSITY, tintVisible, true),
			],
		},
		{
			heading: "Views & status",
			items: [
				toggle("maskReadingView", "Mask reading view", "Hide rendered note text as well as the editor. Images and other media stay unchanged."),
				toggle("showStatusBar", "Show status bar indicator", "Show the current privacy mode state in the status bar. Select it to toggle privacy mode."),
			],
		},
	];
}
