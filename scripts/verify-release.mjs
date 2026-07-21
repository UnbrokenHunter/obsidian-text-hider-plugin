/* global process */

import { existsSync, readFileSync, statSync } from "node:fs";

const expectedTag = process.argv[2];
const packageJson = readJson("package.json");
const manifest = readJson("manifest.json");
const versions = readJson("versions.json");

assert(
  manifest.version === packageJson.version,
  `manifest.json version (${manifest.version}) must match package.json version (${packageJson.version}).`
);
assert(
  versions[manifest.version] === manifest.minAppVersion,
  `versions.json must map ${manifest.version} to ${manifest.minAppVersion}.`
);

if (expectedTag) {
  assert(expectedTag === manifest.version, `Release tag (${expectedTag}) must match manifest.json version (${manifest.version}).`);
}

for (const artifact of ["main.js", "manifest.json", "styles.css"]) {
  assert(existsSync(artifact), `Missing release artifact: ${artifact}.`);
  assert(statSync(artifact).size > 0, `Release artifact is empty: ${artifact}.`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
