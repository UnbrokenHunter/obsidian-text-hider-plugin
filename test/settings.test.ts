import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSettings } from "../src/settings/normalize";
import { DEFAULT_SETTINGS, MAX_BLUR_STRENGTH, MAX_SCREEN_TINT_HUE, MIN_SCREEN_TINT_BRIGHTNESS } from "../src/settings/types";

test("normalizes missing settings to defaults", () => {
	assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
});

test("migrates legacy header and callout settings", () => {
	const settings = normalizeSettings({
		excludeHeaders: false,
		hideCallouts: true,
		excludeCallouts: true,
	});

	assert.equal(settings.headerMode, "mask");
	assert.equal(settings.calloutMode, "hide");
});

test("keeps explicit content handling settings over legacy values", () => {
	const settings = normalizeSettings({
		headerMode: "hide",
		calloutMode: "exclude",
		hideCallouts: true,
	});

	assert.equal(settings.headerMode, "hide");
	assert.equal(settings.calloutMode, "exclude");
});

test("clamps saved numeric settings and rejects invalid modes", () => {
	const settings = normalizeSettings({
		maskMode: "invalid",
		revealMode: "invalid",
		revealCount: 999,
		blurStrength: 999,
		screenTintBrightness: -999,
		screenTintHue: 999,
		screenTintIntensity: -5,
	});

	assert.equal(settings.maskMode, DEFAULT_SETTINGS.maskMode);
	assert.equal(settings.revealMode, DEFAULT_SETTINGS.revealMode);
	assert.equal(settings.revealCount, 100);
	assert.equal(settings.blurStrength, MAX_BLUR_STRENGTH);
	assert.equal(settings.screenTintBrightness, MIN_SCREEN_TINT_BRIGHTNESS);
	assert.equal(settings.screenTintHue, MAX_SCREEN_TINT_HUE);
	assert.equal(settings.screenTintIntensity, 0);
});