import assert from "node:assert/strict";
import test from "node:test";
import { assertReleasePreflight, getNextVersion } from "../scripts/release-utils.mjs";

test("release preflight accepts a clean main branch with a new tag", () => {
	assert.doesNotThrow(() => assertReleasePreflight({ branch: "main", clean: true, tagExists: false }));
});

test("release preflight rejects a dirty working tree", () => {
	assert.throws(
		() => assertReleasePreflight({ branch: "main", clean: false, tagExists: false }),
		/Commit, stash, or discard/,
	);
});

test("release preflight rejects a non-main branch", () => {
	assert.throws(
		() => assertReleasePreflight({ branch: "improve-performance", clean: true, tagExists: false }),
		/Run releases from the main branch/,
	);
});

test("release preflight rejects an existing tag before mutating version files", () => {
	assert.throws(
		() => assertReleasePreflight({ branch: "main", clean: true, tagExists: true }),
		/release tag already exists/,
	);
});

test("release version calculation produces stable matching tags", () => {
	assert.equal(getNextVersion("1.1.0", "patch"), "1.1.1");
	assert.equal(getNextVersion("1.1.0", "minor"), "1.2.0");
	assert.equal(getNextVersion("1.1.0", "major"), "2.0.0");
	assert.throws(() => getNextVersion("1.1.0-beta.1", "patch"), /stable semantic version/);
	assert.throws(() => getNextVersion("1.1.0", "invalid"), /Usage/);
});
