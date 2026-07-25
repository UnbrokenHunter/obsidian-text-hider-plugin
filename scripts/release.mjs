import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";
import { assertReleasePreflight, getNextVersion, getNpmCommand } from "./release-utils.mjs";

const bumpType = process.argv[2];

function run(command, args) {
	execFileSync(command, args, { stdio: "inherit" });
}

function output(command, args) {
	return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function readVersion() {
	return JSON.parse(readFileSync("package.json", "utf8")).version;
}

const currentVersion = readVersion();
const nextVersion = getNextVersion(currentVersion, bumpType);
const npmCommand = getNpmCommand(process.platform);
const branch = output("git", ["branch", "--show-current"]);
const clean = !output("git", ["status", "--porcelain"]);

assertReleasePreflight({ branch, clean, tagExists: false });
run("git", ["fetch", "--tags", "origin"]);
assertReleasePreflight({
	branch,
	clean,
	tagExists: output("git", ["tag", "--list", nextVersion]) === nextVersion,
});

run(npmCommand, ["version", bumpType, "--no-git-tag-version"]);

const version = readVersion();
if (version !== nextVersion) {
	throw new Error(`Expected npm to set version ${nextVersion}, received ${version}.`);
}
run(npmCommand, ["run", "verify:release"]);
run("git", ["diff", "--check"]);
run("git", ["add", "package.json", "package-lock.json", "manifest.json", "versions.json"]);
run("git", ["commit", "-m", `release: ${version}`]);
run("git", ["tag", "-a", version, "-m", `Release ${version}`]);
run("git", ["push", "origin", "main"]);
run("git", ["push", "origin", version]);

console.log(`Released ${version}. GitHub Actions will publish the matching release assets.`);
