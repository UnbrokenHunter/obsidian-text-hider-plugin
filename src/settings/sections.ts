import { Setting } from "obsidian";
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
	type ContentHandlingMode,
	type MaskMode,
	type RevealMode,
} from "./types";

async function saveAndApply(plugin: TextHiderPlugin): Promise<void> {
	await plugin.saveSettings();
	plugin.notifySettingsChanged();
}

function addContentHandlingSetting(
	containerEl: HTMLElement,
	plugin: TextHiderPlugin,
	name: string,
	description: string,
	getValue: () => ContentHandlingMode,
	setValue: (value: ContentHandlingMode) => void,
): void {
	new Setting(containerEl)
		.setName(name)
		.setDesc(description)
		.addDropdown((dropdown) => {
			dropdown.addOption("exclude", "Keep visible");
			dropdown.addOption("mask", "Mask text");
			dropdown.addOption("hide", "Hide completely");
			dropdown.setValue(getValue());
			dropdown.onChange(async (value) => {
				setValue(value as ContentHandlingMode);
				await saveAndApply(plugin);
			});
		});
}

export function addMaskingAndRevealSettings(containerEl: HTMLElement, plugin: TextHiderPlugin): void {
	new Setting(containerEl)
		.setName("Enable text hider")
		.setDesc("Turn masking on or off. You can assign hotkeys to the toggle, enable, and disable commands.")
		.addToggle((toggle) =>
			toggle.setValue(plugin.settings.enabled).onChange(async (value) => {
				plugin.settings.enabled = value;
				await saveAndApply(plugin);
			}),
		);

	new Setting(containerEl).setName("Masking & reveal").setHeading();

	let blurStrengthSetting: Setting | undefined;
	const updateBlurStrengthVisibility = () => {
		blurStrengthSetting?.settingEl.toggleClass("text-hider-setting-hidden", plugin.settings.maskMode !== "blur");
	};

	new Setting(containerEl)
		.setName("Mask mode")
		.setDesc("How hidden text is shown. Hide is cleanest, blur is softer, and password can vary by theme.")
		.addDropdown((dropdown) => {
			dropdown.addOption("hide", "Hide");
			dropdown.addOption("blur", "Blur");
			dropdown.addOption("password", "Password");
			dropdown.setValue(plugin.settings.maskMode);
			dropdown.onChange(async (value) => {
				plugin.settings.maskMode = value as MaskMode;
				updateBlurStrengthVisibility();
				await saveAndApply(plugin);
			});
		});

	blurStrengthSetting = new Setting(containerEl)
		.setName("Blur strength")
		.setDesc("How strongly text is blurred when blur mode is selected.")
		.addSlider((slider) =>
			slider
				.setLimits(MIN_BLUR_STRENGTH, MAX_BLUR_STRENGTH, 1)
				.setValue(plugin.settings.blurStrength)
				.setDynamicTooltip()
				.onChange(async (value) => {
					plugin.settings.blurStrength = value;
					await saveAndApply(plugin);
				}),
		);
	updateBlurStrengthVisibility();

	new Setting(containerEl)
		.setName("Reveal mode")
		.setDesc("What stays readable at each cursor.")
		.addDropdown((dropdown) => {
			dropdown.addOption("word", "Words");
			dropdown.addOption("letter", "Characters");
			dropdown.addOption("sentence", "Sentences");
			dropdown.addOption("line", "Lines");
			dropdown.setValue(plugin.settings.revealMode);
			dropdown.onChange(async (value) => {
				plugin.settings.revealMode = value as RevealMode;
				await saveAndApply(plugin);
			});
		});

	new Setting(containerEl)
		.setName("Reveal amount")
		.setDesc(`How many adjacent characters, words, sentences, or lines to reveal (${1}-${MAX_REVEAL_COUNT}).`)
		.addText((text) =>
			text
				.setValue(String(plugin.settings.revealCount))
				.setPlaceholder("1")
				.onChange(async (value) => {
					const count = Number(value);
					if (!Number.isInteger(count)) return;

					plugin.settings.revealCount = clampRevealCount(count);
					await saveAndApply(plugin);
				}),
		);

	new Setting(containerEl)
		.setName("Reveal selected text")
		.setDesc("Selected text becomes visible while selected.")
		.addToggle((toggle) =>
			toggle.setValue(plugin.settings.revealSelection).onChange(async (value) => {
				plugin.settings.revealSelection = value;
				await saveAndApply(plugin);
			}),
		);
}

export function addExceptionsAndBehaviorSettings(containerEl: HTMLElement, plugin: TextHiderPlugin): void {
	new Setting(containerEl).setName("Exceptions & behavior").setHeading();
	addContentHandlingSetting(
		containerEl,
		plugin,
		"Header handling",
		"Choose how privacy mode treats Markdown headers.",
		() => plugin.settings.headerMode,
		(value) => { plugin.settings.headerMode = value; },
	);
	addContentHandlingSetting(
		containerEl,
		plugin,
		"Callout handling",
		"Choose how privacy mode treats Markdown callouts.",
		() => plugin.settings.calloutMode,
		(value) => { plugin.settings.calloutMode = value; },
	);
	addContentHandlingSetting(
		containerEl,
		plugin,
		"Note title handling",
		"Choose how privacy mode treats the inline note title.",
		() => plugin.settings.titleMode,
		(value) => { plugin.settings.titleMode = value; },
	);
}

function addTintSlider(
	containerEl: HTMLElement,
	plugin: TextHiderPlugin,
	name: string,
	description: string,
	minimum: number,
	maximum: number,
	getValue: () => number,
	setValue: (value: number) => void,
): Setting {
	return new Setting(containerEl)
		.setName(name)
		.setDesc(description)
		.addSlider((slider) => {
			slider.setLimits(minimum, maximum, 1).setValue(getValue()).setDynamicTooltip();
			slider.sliderEl.addEventListener("input", () => {
				setValue(Number(slider.sliderEl.value));
				plugin.updateScreenTint();
			});
			slider.sliderEl.addEventListener("change", () => void plugin.saveSettings());
		});
}

export function addScreenTintSettings(containerEl: HTMLElement, plugin: TextHiderPlugin): void {
	new Setting(containerEl).setName("Screen tint").setHeading();

	const detailSettings: Setting[] = [];
	const updateVisibility = () => {
		for (const setting of detailSettings) {
			setting.settingEl.toggleClass("text-hider-setting-hidden", !plugin.settings.screenTintEnabled);
		}
	};

	new Setting(containerEl)
		.setName("Enable screen tint")
		.setDesc("Tint the entire Obsidian workspace while privacy mode is on.")
		.addToggle((toggle) =>
			toggle.setValue(plugin.settings.screenTintEnabled).onChange(async (value) => {
				plugin.settings.screenTintEnabled = value;
				updateVisibility();
				await saveAndApply(plugin);
			}),
		);

	detailSettings.push(
		addTintSlider(
			containerEl, plugin, "Tint brightness", "Make the workspace darker or lighter.",
			MIN_SCREEN_TINT_BRIGHTNESS, MAX_SCREEN_TINT_BRIGHTNESS,
			() => plugin.settings.screenTintBrightness,
			(value) => { plugin.settings.screenTintBrightness = value; },
		),
		addTintSlider(
			containerEl, plugin, "Tint hue", "Choose the tint color.",
			MIN_SCREEN_TINT_HUE, MAX_SCREEN_TINT_HUE,
			() => plugin.settings.screenTintHue,
			(value) => { plugin.settings.screenTintHue = value; },
		),
		addTintSlider(
			containerEl, plugin, "Tint intensity", "Set the strength of the tint color.",
			MIN_SCREEN_TINT_INTENSITY, MAX_SCREEN_TINT_INTENSITY,
			() => plugin.settings.screenTintIntensity,
			(value) => { plugin.settings.screenTintIntensity = value; },
		),
	);
	updateVisibility();
}

export function addViewsAndStatusSettings(containerEl: HTMLElement, plugin: TextHiderPlugin): void {
	new Setting(containerEl).setName("Views & status").setHeading();

	new Setting(containerEl)
		.setName("Mask reading view")
		.setDesc("Hide rendered note text as well as the editor. Images and other media stay unchanged.")
		.addToggle((toggle) =>
			toggle.setValue(plugin.settings.maskReadingView).onChange(async (value) => {
				plugin.settings.maskReadingView = value;
				await saveAndApply(plugin);
			}),
		);

	new Setting(containerEl)
		.setName("Show status bar indicator")
		.setDesc("Show the current privacy mode state in the status bar. Select it to toggle privacy mode.")
		.addToggle((toggle) =>
			toggle.setValue(plugin.settings.showStatusBar).onChange(async (value) => {
				plugin.settings.showStatusBar = value;
				await saveAndApply(plugin);
			}),
		);
}