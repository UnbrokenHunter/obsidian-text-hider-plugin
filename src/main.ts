import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, TextHiderPluginSettings, TextHiderSettingTab } from "./settings";
import { PrivacyController } from "./privacy/PrivacyController";

export default class TextHiderPlugin extends Plugin {
  settings!: TextHiderPluginSettings;
  private privacy!: PrivacyController;

  async onload() {
    await this.loadSettings();

    this.privacy = new PrivacyController(this);
    this.addSettingTab(new TextHiderSettingTab(this.app, this));
    this.registerCommands();
    this.privacy.syncFromSettings({ reason: "startup" });
  }

  onunload() {
    this.privacy.destroy();
  }

  private registerCommands() {
    this.addCommand({
      id: "toggle-privacy-mode",
      name: "Toggle privacy mode",
      callback: () => this.privacy.toggleEnabled(),
    });

    this.addCommand({
      id: "enable-privacy-mode",
      name: "Enable privacy mode",
      callback: () => this.privacy.setEnabled(true),
    });

    this.addCommand({
      id: "disable-privacy-mode",
      name: "Disable privacy mode",
      callback: () => this.privacy.setEnabled(false),
    });
  }

  notifySettingsChanged() {
    this.privacy.onSettingsChanged();
  }

  async loadSettings() {
    const saved = (await this.loadData()) as Partial<TextHiderPluginSettings>;
    const blurStrength = saved.blurStrength;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      blurStrength:
        typeof blurStrength === "number" && Number.isFinite(blurStrength)
          ? Math.min(16, Math.max(1, blurStrength))
          : DEFAULT_SETTINGS.blurStrength,
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}