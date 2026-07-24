import { App, PluginSettingTab } from "obsidian";
import type TextHiderPlugin from "../main";
import {
	addExceptionsAndBehaviorSettings,
	addMaskingAndRevealSettings,
	addScreenTintSettings,
	addViewsAndStatusSettings,
} from "./sections";

export class TextHiderSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: TextHiderPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		addMaskingAndRevealSettings(containerEl, this.plugin);
		addExceptionsAndBehaviorSettings(containerEl, this.plugin);
		addScreenTintSettings(containerEl, this.plugin);
		addViewsAndStatusSettings(containerEl, this.plugin);
	}
}