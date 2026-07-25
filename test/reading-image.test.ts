import assert from "node:assert/strict";
import test from "node:test";
import { getReadingImageHandlingClasses } from "../src/privacy/reading-view/imageClasses";

test("ignored images receive no Reading View handling classes", () => {
	assert.deepEqual(getReadingImageHandlingClasses("exclude", "blur"), []);
});

test("hidden images receive the hide class", () => {
	assert.deepEqual(getReadingImageHandlingClasses("hide", "blur"), ["privacy-reading-image-mode-hide"]);
});

test("masked images receive classes for every mask style", () => {
	assert.deepEqual(getReadingImageHandlingClasses("mask", "hide"), [
		"privacy-reading-image-mode-mask",
		"privacy-reading-image-mask-mode-hide",
	]);
	assert.deepEqual(getReadingImageHandlingClasses("mask", "password"), [
		"privacy-reading-image-mode-mask",
		"privacy-reading-image-mask-mode-password",
	]);
	assert.deepEqual(getReadingImageHandlingClasses("mask", "blur"), [
		"privacy-reading-image-mode-mask",
		"privacy-reading-image-mask-mode-blur",
	]);
});
