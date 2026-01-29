import { Plugin, Notice } from "obsidian";
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";
import { PrivacyController } from "./privacy/PrivacyController";

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;

	/**
	 * Runtime controller for enabling/disabling privacy mode and reacting
	 * to settings changes. Actual masking implementation lives inside the
	 * controller later (CodeMirror decorations / CSS / etc).
	 */
	private privacy!: PrivacyController;

	async onload() {
		await this.loadSettings();

		// Controller owns runtime state + future editor hooks.
		this.privacy = new PrivacyController(this);

		// Settings UI
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Commands (bind hotkey to toggle command via Obsidian hotkeys settings)
		this.registerCommands();

		// Initialize runtime from persisted setting
		this.privacy.setEnabled(this.settings.enabled, { persist: false, reason: "startup" });
		this.privacy.apply(); // stubbed; does nothing for now
	}
	
	onunload() {
		// Ensure we clean up any listeners/resources when plugin unloads.
		// (Controller handles its own cleanup.)
		this.privacy?.dispose();
	}

	private registerCommands() {
		this.addCommand({
			id: "toggle-privacy-mode",
			name: "Toggle privacy mode",
			callback: async () => {
				this.privacy.toggleEnabled();
			},
		});

		this.addCommand({
			id: "enable-privacy-mode",
			name: "Enable privacy mode",
			callback: async () => {
				this.privacy.setEnabled(true);
			},
		});

		this.addCommand({
			id: "disable-privacy-mode",
			name: "Disable privacy mode",
			callback: async () => {
				this.privacy.setEnabled(false);
			},
		});
	}

	/**
	 * Called by the settings UI (and anything else) when settings change,
	 * so the controller can react. No masking implemented yet.
	 */
	notifySettingsChanged() {
		this.privacy.onSettingsChanged();
	}

	/**
	 * Optional helper you can use during development.
	 */
	notify(message: string) {
		if (this.settings.showNotices) new Notice(message);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
