import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export type MaskMode = "hide" | "password" | "blur";
export type RevealMode = "word" | "letter" | "sentence" | "line";
export type CalloutMode = "mask" | "exclude" | "hide";
export const MIN_REVEAL_COUNT = 1;
export const MAX_REVEAL_COUNT = 100;
export const MIN_SCREEN_TINT_BRIGHTNESS = -75;
export const MAX_SCREEN_TINT_BRIGHTNESS = 35;
export const MIN_SCREEN_TINT_HUE = 0;
export const MAX_SCREEN_TINT_HUE = 360;
export const MIN_SCREEN_TINT_INTENSITY = 0;
export const MAX_SCREEN_TINT_INTENSITY = 35;

export interface TextHiderPluginSettings {
	/** Persisted global default state */
	enabled: boolean;

	/** How to mask non-revealed text */
	maskMode: MaskMode;

	/** What to reveal at the cursor */
	revealMode: RevealMode;

	/** How many adjacent characters, words, sentences, or lines to reveal */
	revealCount: number;

	/** Blur radius in pixels when blur masking is selected */
	blurStrength: number;

	/** How privacy mode treats Markdown headers */
	headerMode: CalloutMode;

	/** How privacy mode treats Markdown callouts */
	calloutMode: CalloutMode;

	/** How privacy mode treats the inline note title */
	titleMode: CalloutMode;

	/** If enabled, selection becomes visible while selected */
	revealSelection: boolean;

/** Apply masking to rendered Markdown in Reading View */
	maskReadingView: boolean;

	/** Apply a color tint over the Obsidian workspace */
	screenTintEnabled: boolean;
	screenTintBrightness: number;
	screenTintHue: number;
	screenTintIntensity: number;

	/** Show the current privacy mode state in the status bar */
	showStatusBar: boolean;
}

export const DEFAULT_SETTINGS: TextHiderPluginSettings = {
	enabled: false,
	maskMode: "blur",
	revealMode: "word",
	revealCount: 1,
	blurStrength: 6,
	headerMode: "exclude",
	calloutMode: "mask",
	titleMode: "mask",
	revealSelection: true,
	maskReadingView: true,
	screenTintEnabled: false,
	screenTintBrightness: -15,
	screenTintHue: 0,
	screenTintIntensity: 0,
	showStatusBar: true,
};

export class TextHiderSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable text hider")
			.setDesc("Turn masking on or off. You can assign hotkeys to the toggle, enable, and disable commands.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

		new Setting(containerEl).setName("Masking & reveal").setHeading();

		let blurStrengthSetting: Setting | null = null;
		const updateBlurStrengthVisibility = () => {
			blurStrengthSetting?.settingEl.toggleClass("text-hider-setting-hidden", this.plugin.settings.maskMode !== "blur");
		};

		new Setting(containerEl)
			.setName("Mask mode")
			.setDesc("How hidden text is shown. Hide is cleanest, blur is softer, and password can vary by theme.")
			.addDropdown((dropdown) => {
				dropdown.addOption("hide", "Hide");
				dropdown.addOption("blur", "Blur");
				dropdown.addOption("password", "Password");
				dropdown.setValue(this.plugin.settings.maskMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.maskMode = value as MaskMode;
					updateBlurStrengthVisibility();
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});

		blurStrengthSetting = new Setting(containerEl)
			.setName("Blur strength")
			.setDesc("How strongly text is blurred when blur mode is selected.")
			.addSlider((slider) =>
				slider
					.setLimits(1, 16, 1)
					.setValue(this.plugin.settings.blurStrength)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.blurStrength = value;
						await this.plugin.saveSettings();
						this.plugin.notifySettingsChanged();
					})
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
				dropdown.setValue(this.plugin.settings.revealMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.revealMode = value as RevealMode;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});

		new Setting(containerEl)
			.setName("Reveal amount")
			.setDesc("How many adjacent characters, words, sentences, or lines to reveal (1-100).")
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.revealCount))
					.setPlaceholder("1")
					.onChange(async (value) => {
						const count = Number(value);
						if (!Number.isInteger(count)) return;

						this.plugin.settings.revealCount = clampRevealCount(count);
						await this.plugin.saveSettings();
						this.plugin.notifySettingsChanged();
					})
			);

		new Setting(containerEl)
			.setName("Reveal selected text")
			.setDesc("Selected text becomes visible while selected.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.revealSelection).onChange(async (value) => {
					this.plugin.settings.revealSelection = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

		new Setting(containerEl).setName("Exceptions & behavior").setHeading();
		new Setting(containerEl)
			.setName("Header handling")
			.setDesc("Choose how privacy mode treats Markdown headers.")
			.addDropdown((dropdown) => {
				dropdown.addOption("mask", "Mask text");
				dropdown.addOption("exclude", "Keep visible");
				dropdown.addOption("hide", "Hide completely");
				dropdown.setValue(this.plugin.settings.headerMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.headerMode = value as CalloutMode;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});


		new Setting(containerEl)
			.setName("Callout handling")
			.setDesc("Choose how privacy mode treats Markdown callouts.")
			.addDropdown((dropdown) => {
				dropdown.addOption("mask", "Mask text");
				dropdown.addOption("exclude", "Keep visible");
				dropdown.addOption("hide", "Hide completely");
				dropdown.setValue(this.plugin.settings.calloutMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.calloutMode = value as CalloutMode;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});
		new Setting(containerEl)
			.setName("Note title handling")
			.setDesc("Choose how privacy mode treats the inline note title.")
			.addDropdown((dropdown) => {
				dropdown.addOption("mask", "Mask text");
				dropdown.addOption("exclude", "Keep visible");
				dropdown.addOption("hide", "Hide completely");
				dropdown.setValue(this.plugin.settings.titleMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.titleMode = value as CalloutMode;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});

		new Setting(containerEl).setName("Screen tint").setHeading();

		const screenTintDetailSettings: Setting[] = [];
		const updateScreenTintSettingsVisibility = () => {
			for (const setting of screenTintDetailSettings) {
				setting.settingEl.toggleClass("text-hider-setting-hidden", !this.plugin.settings.screenTintEnabled);
			}
		};

		new Setting(containerEl)
			.setName("Enable screen tint")
			.setDesc("Tint the entire Obsidian workspace while privacy mode is on.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.screenTintEnabled).onChange(async (value) => {
					this.plugin.settings.screenTintEnabled = value;
					updateScreenTintSettingsVisibility();
					this.plugin.notifySettingsChanged();
					await this.plugin.saveSettings();
				})
			);

		const tintBrightnessSetting = new Setting(containerEl)
			.setName("Tint brightness")
			.setDesc("Make the workspace darker or lighter.")
			.addSlider((slider) => {
				slider
					.setLimits(MIN_SCREEN_TINT_BRIGHTNESS, MAX_SCREEN_TINT_BRIGHTNESS, 1)
					.setValue(this.plugin.settings.screenTintBrightness)
					.setDynamicTooltip();
				slider.sliderEl.addEventListener("input", () => {
					this.plugin.settings.screenTintBrightness = Number(slider.sliderEl.value);
					this.plugin.updateScreenTint();
				});
				slider.sliderEl.addEventListener("change", () => void this.plugin.saveSettings());
			});
		screenTintDetailSettings.push(tintBrightnessSetting);
		const tintHueSetting = new Setting(containerEl)
			.setName("Tint hue")
			.setDesc("Choose the tint color.")
			.addSlider((slider) => {
				slider
					.setLimits(MIN_SCREEN_TINT_HUE, MAX_SCREEN_TINT_HUE, 1)
					.setValue(this.plugin.settings.screenTintHue)
					.setDynamicTooltip();
				slider.sliderEl.addEventListener("input", () => {
					this.plugin.settings.screenTintHue = Number(slider.sliderEl.value);
					this.plugin.updateScreenTint();
				});
				slider.sliderEl.addEventListener("change", () => void this.plugin.saveSettings());
			});
		screenTintDetailSettings.push(tintHueSetting);
		const tintIntensitySetting = new Setting(containerEl)
			.setName("Tint intensity")
			.setDesc("Set the strength of the tint color.")
			.addSlider((slider) => {
				slider
					.setLimits(MIN_SCREEN_TINT_INTENSITY, MAX_SCREEN_TINT_INTENSITY, 1)
					.setValue(this.plugin.settings.screenTintIntensity)
					.setDynamicTooltip();
				slider.sliderEl.addEventListener("input", () => {
					this.plugin.settings.screenTintIntensity = Number(slider.sliderEl.value);
					this.plugin.updateScreenTint();
				});
				slider.sliderEl.addEventListener("change", () => void this.plugin.saveSettings());
			});
		screenTintDetailSettings.push(tintIntensitySetting);		updateScreenTintSettingsVisibility();

		new Setting(containerEl).setName("Views & status").setHeading();

		new Setting(containerEl)
			.setName("Mask reading view")
			.setDesc("Hide rendered note text as well as the editor. Images and other media stay unchanged.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.maskReadingView).onChange(async (value) => {
					this.plugin.settings.maskReadingView = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);
		new Setting(containerEl)
			.setName("Show status bar indicator")
			.setDesc("Show the current privacy mode state in the status bar. Select it to toggle privacy mode.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showStatusBar).onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);


	}
}

export function clampRevealCount(value: number): number {
	return Math.min(MAX_REVEAL_COUNT, Math.max(MIN_REVEAL_COUNT, value));
}

export function isCalloutMode(value: unknown): value is CalloutMode {
	return value === "mask" || value === "exclude" || value === "hide";
}
export function clampScreenTintBrightness(value: number): number {
	return Math.min(MAX_SCREEN_TINT_BRIGHTNESS, Math.max(MIN_SCREEN_TINT_BRIGHTNESS, value));
}

export function clampScreenTintHue(value: number): number {
	return Math.min(MAX_SCREEN_TINT_HUE, Math.max(MIN_SCREEN_TINT_HUE, value));
}

export function clampScreenTintIntensity(value: number): number {
	return Math.min(MAX_SCREEN_TINT_INTENSITY, Math.max(MIN_SCREEN_TINT_INTENSITY, value));
}