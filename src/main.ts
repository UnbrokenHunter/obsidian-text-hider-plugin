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

    // Initialize runtime from persisted settings
    this.privacy.syncFromSettings({ reason: "startup" });
  }

  private registerCommands() {
    this.addCommand({
      id: "toggle-text-hider",
      name: "Toggle text hider",
      callback: () => this.privacy.toggleEnabled(),
    });

    this.addCommand({
      id: "enable-text-hider",
      name: "Enable text hider",
      callback: () => this.privacy.setEnabled(true),
    });

    this.addCommand({
      id: "disable-text-hider",
      name: "Disable text hider",
      callback: () => this.privacy.setEnabled(false),
    });
  }

  notifySettingsChanged() {
    this.privacy.onSettingsChanged();
  }  

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<TextHiderPluginSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
