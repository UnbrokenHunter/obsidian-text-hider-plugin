import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export type MaskMode = "hide" | "password" | "blur";
export type RevealMode = "word" | "letter";

export interface TextHiderPluginSettings {
	/** Persisted global default state */
	enabled: boolean;

	/** How to mask non-revealed text */
	maskMode: MaskMode;

	/** What to reveal at the cursor */
	revealMode: RevealMode;

	/** Blur radius in pixels when blur masking is selected */
	blurStrength: number;

	/** Keep Markdown headers visible (#, ##, etc.) */
	excludeHeaders: boolean;

	/** If enabled, selection becomes visible while selected */
	revealSelection: boolean;

	/** If enabled, the line containing each cursor stays readable */
	revealCurrentLine: boolean;

	/** Apply masking to rendered Markdown in Reading View */
	maskReadingView: boolean;

	/** Show the current privacy mode state in the status bar */
	showStatusBar: boolean;
}

export const DEFAULT_SETTINGS: TextHiderPluginSettings = {
	enabled: false,
	maskMode: "blur",
	revealMode: "word",
	blurStrength: 6,
	excludeHeaders: true,
	revealSelection: true,
	revealCurrentLine: false,
	maskReadingView: true,
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
				dropdown.addOption("word", "Current word");
				dropdown.addOption("letter", "Current letter");
				dropdown.setValue(this.plugin.settings.revealMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.revealMode = value as RevealMode;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});

		new Setting(containerEl).setName("Exceptions & behavior").setHeading();

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

		new Setting(containerEl)
			.setName("Reveal current line")
			.setDesc("Keep the full line containing each cursor readable.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.revealCurrentLine).onChange(async (value) => {
					this.plugin.settings.revealCurrentLine = value;
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