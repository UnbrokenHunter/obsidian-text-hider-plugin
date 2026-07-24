import { Plugin } from "obsidian";
import {
  CalloutMode,
  clampRevealCount,
  DEFAULT_SETTINGS,
  isCalloutMode,
  TextHiderPluginSettings,
  TextHiderSettingTab,
} from "./settings";
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
    this.privacy?.destroy();
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
    const saved = ((await this.loadData()) ?? {}) as Partial<TextHiderPluginSettings> & {
      excludeHeaders?: boolean;
      excludeCallouts?: boolean;
      hideCallouts?: boolean;
    };
    const { excludeHeaders, excludeCallouts, hideCallouts, ...currentSaved } = saved;
    const blurStrength = saved.blurStrength;
    const revealCount = saved.revealCount;
    const calloutMode: CalloutMode = isCalloutMode(saved.calloutMode)
      ? saved.calloutMode
      : hideCallouts
        ? "hide"
        : excludeCallouts
          ? "exclude"
          : DEFAULT_SETTINGS.calloutMode;
const titleMode: CalloutMode = isCalloutMode(saved.titleMode) ? saved.titleMode : DEFAULT_SETTINGS.titleMode;
    const headerMode: CalloutMode = isCalloutMode(saved.headerMode)
      ? saved.headerMode
      : excludeHeaders === false
        ? "mask"
        : DEFAULT_SETTINGS.headerMode;

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...currentSaved,
      calloutMode,
      titleMode,
      headerMode,
      blurStrength:
        typeof blurStrength === "number" && Number.isFinite(blurStrength)
          ? Math.min(16, Math.max(1, blurStrength))
          : DEFAULT_SETTINGS.blurStrength,
      revealCount:
        typeof revealCount === "number" && Number.isFinite(revealCount)
          ? clampRevealCount(Math.round(revealCount))
          : DEFAULT_SETTINGS.revealCount,
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}