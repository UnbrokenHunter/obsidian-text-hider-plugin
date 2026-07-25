import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const bumpType = process.argv[2];
const allowedBumpTypes = new Set(["patch", "minor", "major"]);

if (!allowedBumpTypes.has(bumpType)) {
	throw new Error("Usage: node scripts/release.mjs <patch|minor|major>");
}

function run(command, args) {
	execFileSync(command, args, { stdio: "inherit" });
}

function output(command, args) {
	return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function assertCleanWorkingTree() {
	if (output("git", ["status", "--porcelain"])) {
		throw new Error("Commit, stash, or discard existing changes before starting a release.");
	}
}

function assertMainBranch() {
	if (output("git", ["branch", "--show-current"]) !== "main") {
		throw new Error("Run releases from the main branch.");
	}
}

function readVersion() {
	return JSON.parse(readFileSync("package.json", "utf8")).version;
}

assertCleanWorkingTree();
assertMainBranch();

run("npm", ["version", bumpType, "--no-git-tag-version"]);

const version = readVersion();
run("npm", ["run", "verify:release"]);
run("git", ["diff", "--check"]);
run("git", ["add", "package.json", "package-lock.json", "manifest.json", "versions.json"]);
run("git", ["commit", "-m", `release: ${version}`]);
run("git", ["tag", "-a", version, "-m", `Release ${version}`]);
run("git", ["push", "origin", "main"]);
run("git", ["push", "origin", version]);

console.log(`Released ${version}. GitHub Actions will publish the matching release assets.`);
