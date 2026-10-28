import { App, PluginSettingTab, requireApiVersion, Setting, type SettingDefinitionItem } from "obsidian";
import type TextHiderPlugin from "../main";
import { createSettingsSections } from "./sections";

export class TextHiderSettingTab extends PluginSettingTab {
	private legacyVisibility: (() => void)[] = [];

	constructor(app: App, private readonly plugin: TextHiderPlugin) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return createSettingsSections(this.plugin, () => this.refreshVisibility()).flatMap<SettingDefinitionItem>((section) =>
			section.heading ? [{ type: "group", heading: section.heading, items: section.items }] : section.items,
		);
	}

	// Obsidian < 1.13 renders the same definitions through the legacy API.
	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		this.legacyVisibility = [];
		for (const section of createSettingsSections(this.plugin, () => this.refreshVisibility())) {
			if (section.heading) new Setting(containerEl).setName(section.heading).setHeading();
			for (const definition of section.items) {
				const setting = new Setting(containerEl).setName(definition.name);
				if (definition.desc) setting.setDesc(definition.desc);
				definition.render(setting);
				this.legacyVisibility.push(() => {
					const visible = typeof definition.visible === "function" ? definition.visible() : definition.visible !== false;
					setting.settingEl.toggleClass("text-hider-setting-hidden", !visible);
				});
			}
		}
		this.refreshVisibility();
	}

	private refreshVisibility(): void {
		for (const refresh of this.legacyVisibility) refresh();
		if (requireApiVersion("1.13.0")) this.refreshDomState();
	}

	hide(): void {
		this.legacyVisibility = [];
	}
}
