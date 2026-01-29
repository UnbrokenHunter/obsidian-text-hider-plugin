import { Plugin, Notice } from "obsidian";
import { DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab } from "./settings";
import { PrivacyController } from "./privacy/PrivacyController";

export default class MyPlugin extends Plugin {
  settings!: MyPluginSettings;
  private privacy!: PrivacyController;

  async onload() {
    await this.loadSettings();

    this.privacy = new PrivacyController(this);

    this.addSettingTab(new SampleSettingTab(this.app, this));
    this.registerCommands();

    // Initialize runtime from persisted settings
    this.privacy.syncFromSettings({ reason: "startup" });
  }

  onunload() {
    this.privacy?.dispose();
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

  notify(msg: string) {
    if (this.settings.showNotices) new Notice(msg);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<MyPluginSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
