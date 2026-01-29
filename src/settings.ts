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

	/** Keep the note title line visible (first markdown heading line) */
	excludeTitleLine: boolean;

	/** Keep YAML frontmatter block visible */
	excludeFrontmatter: boolean;

	/** Keep Markdown headers visible (#, ##, etc.) */
	excludeHeaders: boolean;

	/** If enabled, selection becomes visible while selected */
	revealSelection: boolean;

	/** Optional: show a notice when toggling (helpful during dev) */
	showNotices: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	enabled: false,
	maskMode: "hide",
	revealMode: "word",
	excludeTitleLine: true,
	excludeFrontmatter: true,
	excludeHeaders: true,
	revealSelection: true,
	showNotices: true,
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
				dd.addOption("hide", "Hide (blank)");
				dd.addOption("password", "Password (***** )");
				dd.addOption("blur", "Blur");
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
			.setName("Keep title line visible")
			.setDesc("If your note starts with a markdown heading, keep that line visible.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.excludeTitleLine).onChange(async (value) => {
				this.plugin.settings.excludeTitleLine = value;
				await this.plugin.saveSettings();
				this.plugin.notifySettingsChanged();
				})
			);

		new Setting(containerEl)
			.setName("Keep frontmatter visible")
			.setDesc("Keep YAML frontmatter (--- ... ---) visible at the top of the note.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.excludeFrontmatter).onChange(async (value) => {
				this.plugin.settings.excludeFrontmatter = value;
				await this.plugin.saveSettings();
				this.plugin.notifySettingsChanged();
				})
			);

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

		new Setting(containerEl)
			.setName("Show notices")
			.setDesc("Show a popup notice when toggling (useful while developing).")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showNotices).onChange(async (value) => {
					this.plugin.settings.showNotices = value;
					await this.plugin.saveSettings();
					// No need to re-apply masking just because notice preference changed.
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
