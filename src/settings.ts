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
	maskMode: "hide",
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

		containerEl.createEl("h2", { text: "Privacy Mode" });

		new Setting(containerEl)
			.setName("Privacy mode (global)")
			.setDesc(
				"Turns masking on/off. You can also bind a hotkey to the Toggle privacy mode command."
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

		new Setting(containerEl)
			.setName("Mask style")
			.setDesc("Hide characters entirely, or show ***** in place of letters.")
			.addDropdown((dd) => {
				dd.addOption("hide", "Hiden (blank)");
				dd.addOption("blur", "Blurred");
				dd.addOption("password", "Password (*****) (may have formatting issues)");
				dd.setValue(this.plugin.settings.maskMode);
				dd.onChange(async (value) => {
					this.plugin.settings.maskMode = value as MaskMode;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				});
			});

		new Setting(containerEl)
			.setName("Reveal at cursor")
			.setDesc("What should remain visible at the cursor position.")
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

		new Setting(containerEl)
			.setName("Exclude headers")
			.setDesc("Keep Markdown headers (#, ##, ###, etc.) visible.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.excludeHeaders).onChange(async (value) => {
					this.plugin.settings.excludeHeaders = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

		new Setting(containerEl)
			.setName("Reveal selected text")
			.setDesc("If enabled, selected text becomes visible while selected.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.revealSelection).onChange(async (value) => {
					this.plugin.settings.revealSelection = value;
					await this.plugin.saveSettings();
					this.plugin.notifySettingsChanged();
				})
			);

		containerEl.createEl("h3", { text: "Hotkey" });
		containerEl.createEl("p", {
			text:
				"Bind a hotkey to: Settings → Hotkeys → search “Toggle privacy mode”. " +
				"Obsidian keybinds commands rather than plugins hardcoding key combos.",
		});
	}
}
