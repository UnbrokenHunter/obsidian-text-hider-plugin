import assert from "node:assert/strict";
import test from "node:test";
import type { Setting } from "obsidian";
import type TextHiderPlugin from "../src/main";
import { createSettingsSections, type SettingsRow } from "../src/settings/sections";
import { DEFAULT_SETTINGS, type TextHiderPluginSettings } from "../src/settings/types";

class Control {
	value: unknown;
	options: Record<string, string> = {};
	tooltip = false;
	sliderEl = Object.assign(new EventTarget(), { value: "" });
	change: (value: unknown) => void | Promise<void> = () => {};
	setValue(value: unknown): this { this.value = value; this.sliderEl.value = String(value); return this; }
	setLimits(): this { return this; }
	setPlaceholder(): this { return this; }
	setDynamicTooltip(): this { this.tooltip = true; return this; }
	addOptions(options: Record<string, string>): this { this.options = options; return this; }
	onChange(callback: (value: unknown) => void | Promise<void>): this { this.change = callback; return this; }
}

function render(row: SettingsRow, inlineValues = true): Control {
	const control = new Control();
	if (inlineValues) Object.assign(control, { setDisplayFormat: () => control });
	const addControl = (callback: (control: Control) => void) => { callback(control); return setting; };
	const setting = { addToggle: addControl, addDropdown: addControl, addSlider: addControl, addText: addControl };
	row.render(setting as unknown as Setting);
	return control;
}

function setup() {
	const saved: TextHiderPluginSettings[] = [];
	let applied = 0;
	let tinted = 0;
	let refreshed = 0;
	const plugin = {
		settings: { ...DEFAULT_SETTINGS },
		async saveSettings() { saved.push({ ...this.settings }); },
		notifySettingsChanged() { applied++; },
		updateScreenTint() { tinted++; },
	};
	const sections = createSettingsSections(plugin as unknown as TextHiderPlugin, () => { refreshed++; });
	const rows = sections.flatMap(section => section.items);
	const row = (name: string) => {
		const found = rows.find(item => item.name === name);
		assert.ok(found, `Missing setting: ${name}`);
		return found;
	};
	return { plugin, saved, row, rows, effects: () => ({ applied, tinted, refreshed }) };
}

test("settings definitions expose every setting once without rendering or saving", () => {
	const { rows, saved, effects } = setup();
	assert.equal(rows.length, Object.keys(DEFAULT_SETTINGS).length);
	assert.equal(new Set(rows.map(row => row.name)).size, rows.length);
	assert.ok(rows.every(row => row.name && row.desc && typeof row.render === "function"));
	assert.deepEqual(saved, []);
	assert.deepEqual(effects(), { applied: 0, tinted: 0, refreshed: 0 });
});

test("every toggle and dropdown persists its value and applies privacy immediately", async () => {
	const changes: [string, keyof TextHiderPluginSettings, unknown][] = [
		["Enable text hider", "enabled", true],
		["Mask mode", "maskMode", "hide"],
		["Reveal mode", "revealMode", "sentence"],
		["Reveal selected text", "revealSelection", false],
		["Note title handling", "titleMode", "hide"],
		["Header handling", "headerMode", "exclude"],
		["Callout handling", "calloutMode", "hide"],
		["Image handling", "imageMode", "exclude"],
		["Enable screen tint", "screenTintEnabled", true],
		["Mask reading view", "maskReadingView", false],
		["Show status bar indicator", "showStatusBar", false],
	];
	for (const [name, key, value] of changes) {
		const { row, plugin, saved, effects } = setup();
		const control = render(row(name));
		assert.equal(control.value, DEFAULT_SETTINGS[key], name);
		if (typeof value === "string") assert.ok(Object.prototype.hasOwnProperty.call(control.options, value), name);
		await control.change(value);
		assert.equal(plugin.settings[key], value, name);
		assert.equal(saved.length, 1, name);
		assert.equal(saved[0]?.[key], value, name);
		assert.deepEqual(effects(), { applied: 1, tinted: 0, refreshed: 1 }, name);
	}
});

test("blur and tint visibility predicates follow the current settings", () => {
	const { row, plugin } = setup();
	const visible = (name: string) => { const predicate = row(name).visible; return typeof predicate === "function" ? predicate() : predicate !== false; };
	assert.equal(visible("Blur strength"), true);
	plugin.settings.maskMode = "password";
	assert.equal(visible("Blur strength"), false);
	plugin.settings.maskMode = "blur";
	assert.equal(visible("Blur strength"), true);
	for (const name of ["Tint brightness", "Tint hue", "Tint intensity"]) {
		assert.equal(visible(name), false);
		plugin.settings.screenTintEnabled = true;
		assert.equal(visible(name), true);
		plugin.settings.screenTintEnabled = false;
	}
});

test("tint sliders preview each input and persist only when the drag finishes", () => {
	const sliders: [string, "screenTintBrightness" | "screenTintHue" | "screenTintIntensity", number][] = [
		["Tint brightness", "screenTintBrightness", -45],
		["Tint hue", "screenTintHue", 180],
		["Tint intensity", "screenTintIntensity", 25],
	];
	for (const [name, key, value] of sliders) {
		const { row, plugin, saved, effects } = setup();
		const control = render(row(name));
		control.sliderEl.value = String(value);
		control.sliderEl.dispatchEvent(new Event("input"));
		assert.equal(plugin.settings[key], value);
		assert.equal(saved.length, 0);
		assert.deepEqual(effects(), { applied: 0, tinted: 1, refreshed: 0 });
		control.sliderEl.dispatchEvent(new Event("change"));
		assert.equal(saved.length, 1);
		assert.equal(saved[0]?.[key], value);
	}
});

test("blur strength changes persist and apply to privacy", async () => {
	const { row, plugin, saved, effects } = setup();
	await render(row("Blur strength")).change(12);
	assert.equal(plugin.settings.blurStrength, 12);
	assert.equal(saved[0]?.blurStrength, 12);
	assert.equal(effects().applied, 1);
});

test("reveal amount rejects non-integers and clamps values to supported bounds", async () => {
	const { row, plugin, saved } = setup();
	const control = render(row("Reveal amount"));
	for (const invalid of ["2.5", "abc", "Infinity"]) await control.change(invalid);
	assert.equal(saved.length, 0);
	assert.equal(plugin.settings.revealCount, 1);
	await control.change("200");
	assert.equal(plugin.settings.revealCount, 100);
	await control.change("-4");
	assert.equal(plugin.settings.revealCount, 1);
	await control.change("8");
	assert.equal(saved[2]?.revealCount, 8);
});

test("sliders retain tooltips only when the inline-value API is unavailable", () => {
	const { row } = setup();
	for (const name of ["Blur strength", "Tint brightness", "Tint hue", "Tint intensity"]) {
		assert.equal(render(row(name), false).tooltip, true, name);
		assert.equal(render(row(name), true).tooltip, false, name);
	}
});
