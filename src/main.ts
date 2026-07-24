import { Plugin } from "obsidian";
import { normalizeSettings, type TextHiderPluginSettings, TextHiderSettingTab } from "./settings";
import { PrivacyController } from "./privacy/PrivacyController";

export default class TextHiderPlugin extends Plugin {
	settings!: TextHiderPluginSettings;
	private privacy?: PrivacyController;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.privacy = new PrivacyController(this);
		this.addSettingTab(new TextHiderSettingTab(this.app, this));
		this.registerCommands();
		this.privacy.syncFromSettings({ reason: "startup" });
	}

	onunload(): void {
		this.privacy?.destroy();
	}

	private registerCommands(): void {
		this.addCommand({
			id: "toggle-privacy-mode",
			name: "Toggle privacy mode",
			callback: () => this.privacy?.toggleEnabled(),
		});
		this.addCommand({
			id: "enable-privacy-mode",
			name: "Enable privacy mode",
			callback: () => this.privacy?.setEnabled(true),
		});
		this.addCommand({
			id: "disable-privacy-mode",
			name: "Disable privacy mode",
			callback: () => this.privacy?.setEnabled(false),
		});
		this.addCommand({
			id: "set-mask-mode-hide",
			name: "Set mask mode to hide",
			callback: () => this.setMaskMode("hide"),
		});
		this.addCommand({
			id: "set-mask-mode-blur",
			name: "Set mask mode to blur",
			callback: () => this.setMaskMode("blur"),
		});
		this.addCommand({
			id: "set-mask-mode-password",
			name: "Set mask mode to password",
			callback: () => this.setMaskMode("password"),
		});
	}

	private setMaskMode(maskMode: TextHiderPluginSettings["maskMode"]): void {
		if (this.settings.maskMode === maskMode) return;

		this.settings.maskMode = maskMode;
		void this.saveSettings();
		this.notifySettingsChanged();
	}

	notifySettingsChanged(): void {
		this.privacy?.onSettingsChanged();
	}

	updateScreenTint(): void {
		this.privacy?.updateScreenTint();
	}

	async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}