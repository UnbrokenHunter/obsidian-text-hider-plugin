export const RELEASE_BUMP_TYPES = new Set(["patch", "minor", "major"]);

export function getNpmCommand(platform) {
	return platform === "win32" ? "npm.cmd" : "npm";
}

export function getNextVersion(currentVersion, bumpType) {
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);
	if (!match) {
		throw new Error(`Expected a stable semantic version, received ${currentVersion}.`);
	}

	const [major, minor, patch] = match.slice(1).map(Number);
	if (bumpType === "major") return `${major + 1}.0.0`;
	if (bumpType === "minor") return `${major}.${minor + 1}.0`;
	if (bumpType === "patch") return `${major}.${minor}.${patch + 1}`;

	throw new Error("Usage: node scripts/release.mjs <patch|minor|major>");
}

export function assertReleasePreflight({ branch, clean, tagExists }) {
	if (!clean) {
		throw new Error("Commit, stash, or discard existing changes before starting a release.");
	}
	if (branch !== "main") {
		throw new Error("Run releases from the main branch.");
	}
	if (tagExists) {
		throw new Error("The release tag already exists. Choose a newer version before releasing.");
	}
}
