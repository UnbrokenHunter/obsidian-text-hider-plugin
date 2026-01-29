import { App, PluginSettingTab, Setting } from "obsidian";
import MyPlugin from "./main";

export type MaskMode = "hide" | "password" | "blur";
export type RevealMode = "word" | "letter";

export interface MyPluginSettings {
	/** Persisted global default state */
	enabled: boolean;

	/** How to mask non-revealed text */
	maskMode: MaskMode;

	/** What to reveal at the cursor */
	revealMode: RevealMode;

	/** Keep Markdown headers visible (#, ##, etc.) */
	excludeHeaders: boolean;

	/** If enabled, selection becomes visible while selected */
	revealSelection: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	enabled: false,
	maskMode: "blur",
	revealMode: "word",
	excludeHeaders: true,
	revealSelection: true,
};

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

display(): void {
	const { containerEl } = this;
	containerEl.empty();

	// --- Global Toggle (heading row) ---
	new Setting(containerEl)
		.setName("Enable text hider")
		.setDesc("Turn masking on/off. For optimal use, set a hotkey for the Toggle command. You can also bind hotkeys for Enable/Disable. All commands are also available from the Command Palette.")
		.addToggle((toggle) =>
			toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
				this.plugin.settings.enabled = value;
				await this.plugin.saveSettings();
				this.plugin.notifySettingsChanged();
			})
		);

	// Subsection: Masking & Reveal
	new Setting(containerEl).setName("Masking & reveal").setHeading();

	new Setting(containerEl)
		.setName("Mask mode")
		.setDesc("How hidden text is shown (Hide is cleanest, Blur is softer, Password may vary by theme).")
		.addDropdown((dd) => {
			dd.addOption("hide", "Hide");
			dd.addOption("blur", "Blur");
			dd.addOption("password", "Password");
			dd.setValue(this.plugin.settings.maskMode);
			dd.onChange(async (value) => {
				this.plugin.settings.maskMode = value as MaskMode;
				await this.plugin.saveSettings();
				this.plugin.notifySettingsChanged();
			});
		});

	new Setting(containerEl)
		.setName("Reveal mode")
		.setDesc("What stays readable at the cursor.")
		.addDropdown((dd) => {
			dd.addOption("word", "Current word");
			dd.addOption("letter", "Current letter");
			dd.setValue(this.plugin.settings.revealMode);
			dd.onChange(async (value) => {
				this.plugin.settings.revealMode = value as RevealMode;
				await this.plugin.saveSettings();
				this.plugin.notifySettingsChanged();
			});
		});

	// Subsection: Exceptions & behavior
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
	}
}
