import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/settings/types";
import { buildScreenTintBackground, shouldShowScreenTint } from "../src/privacy/screen-tint/style";

test("screen tint only appears when privacy mode and tint are enabled", () => {
	assert.equal(shouldShowScreenTint(false, { ...DEFAULT_SETTINGS, screenTintEnabled: true }), false);
	assert.equal(shouldShowScreenTint(true, { ...DEFAULT_SETTINGS, screenTintEnabled: false }), false);
	assert.equal(shouldShowScreenTint(true, { ...DEFAULT_SETTINGS, screenTintEnabled: true }), true);
});

test("screen tint background keeps brightness and hue layers transparent", () => {
	const background = buildScreenTintBackground({
		...DEFAULT_SETTINGS,
		screenTintBrightness: -75,
		screenTintHue: 210,
		screenTintIntensity: 35,
	});

	assert.match(background, /hsla\(210, 100%, 50%, 0\.25\)/);
	assert.match(background, /rgba\(0, 0, 0, 0\.45\)/);
});