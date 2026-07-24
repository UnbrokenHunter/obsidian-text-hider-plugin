import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export type MaskMode = "hide" | "password" | "blur";
export type RevealMode = "word" | "letter" | "sentence" | "line";
export const MIN_REVEAL_COUNT = 1;
export const MAX_REVEAL_COUNT = 100;

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

	/** Keep Markdown headers visible (#, ##, etc.) */
	excludeHeaders: boolean;

	/** Keep Markdown callouts visible */
	excludeCallouts: boolean;

	/** If enabled, selection becomes visible while selected */
	revealSelection: boolean;

	/** Apply masking to rendered Markdown in Reading View */
	maskReadingView: boolean;

	/** Hide rendered callout boxes while privacy mode is enabled */
	hideCallouts: boolean;

	/** Show the current privacy mode state in the status bar */
	showStatusBar: boolean;
}

export const DEFAULT_SETTINGS: TextHiderPluginSettings = {
	enabled: false,
	maskMode: "blur",
	revealMode: "word",
	revealCount: 1,
	blurStrength: 6,
	excludeHeaders: true,
	excludeCallouts: false,
	revealSelection: true,
	maskReadingView: true,
	hideCallouts: false,
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
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});

		new Setting(containerEl)
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
			.setDesc("How many adjacent characters, words, sentences, or lines to reveal (1–100).")
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
			.setName("Exclude callouts")
			.setDesc("Keep Markdown callouts readable.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.excludeCallouts).onChange(async (value) => {
					this.plugin.settings.excludeCallouts = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

		new Setting(containerEl)
			.setName("Exclude headers")
			.setDesc("Keep Markdown headers (#, ##, ###) visible.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.excludeHeaders).onChange(async (value) => {
					this.plugin.settings.excludeHeaders = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

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
			.setName("Hide callouts")
			.setDesc("Hide callout boxes in reading view while privacy mode is on.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.hideCallouts).onChange(async (value) => {
					this.plugin.settings.hideCallouts = value;
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