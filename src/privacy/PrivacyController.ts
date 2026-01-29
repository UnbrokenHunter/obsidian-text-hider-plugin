import { MarkdownView, WorkspaceLeaf } from "obsidian";
import type MyPlugin from "../main";
import type { SetEnabledOptions } from "./types";

export class PrivacyController {
	private plugin: MyPlugin;

	// Runtime state (may mirror settings.enabled, but can be treated separately if desired later)
	private enabled: boolean;

	// Placeholders for future cleanup of registered listeners/resources
	private disposers: Array<() => void> = [];

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
		this.enabled = plugin.settings.enabled;

		// Infrastructure hooks you’ll likely need later:
		// - active leaf changes (user switched notes)
		// - layout changes (panes opened/closed)
		// - editor changes (cursor/selection events inside CM6)
		// We DO NOT implement masking here yet; we only wire the scaffolding.

		this.registerWorkspaceHooks();
	}

	dispose() {
		for (const d of this.disposers) d();
		this.disposers = [];
	}

	getEnabled() {
		return this.enabled;
	}

	toggleEnabled() {
		this.setEnabled(!this.enabled, { persist: true, reason: "command" });
	}

	setEnabled(next: boolean, opts: SetEnabledOptions = {}) {
		const prev = this.enabled;
		this.enabled = next;

		const persist = opts.persist ?? true;

		if (persist) {
			this.plugin.settings.enabled = next;
			void this.plugin.saveSettings();
		}

		// Don’t spam notices unless you want it. Tweak later.
		this.plugin.notify(`Privacy mode: ${this.enabled ? "ON" : "OFF"}`);

		// React to the state change (still stubbed)
		if (prev !== next) this.apply(opts.reason ?? "unknown");
	}

	onSettingsChanged() {
		// Called after any settings UI change.
		// Later, you’ll reconfigure masking behavior here.
		this.apply("settings-change");
	}

	apply(_reason: string = "unknown") {
		// STUB: This is where later you’ll:
		// - attach/remove CodeMirror decorations
		// - update masking based on:
		//   settings.maskMode, settings.revealMode, settings.excludeHeaders, settings.revealSelection
		// - update current active editor/view
		//
		// For now: do nothing.
	}

	private registerWorkspaceHooks() {
		// Active note/editor changed
		const off1 = this.plugin.app.workspace.on("active-leaf-change", (leaf) => {
			// Later: re-apply to new editor/view
			if (leaf) this.apply("active-editor-change");
		});
		this.disposers.push(() => this.plugin.app.workspace.offref(off1));

		// Layout changed (panes opened/closed, etc.)
		const off2 = this.plugin.app.workspace.on("layout-change", () => {
			// Later: re-apply if needed
			this.apply("unknown");
		});
		this.disposers.push(() => this.plugin.app.workspace.offref(off2));
	}

	/**
	 * Utility for later: get the active markdown view safely.
	 */
	private getActiveMarkdownView(): MarkdownView | null {
		return this.plugin.app.workspace.getActiveViewOfType(MarkdownView) ?? null;
	}

	/**
	 * Utility for later: get active leaf if you need it.
	 */
	private getActiveLeaf(): WorkspaceLeaf | null {
		return this.plugin.app.workspace.getMostRecentLeaf() ?? null;
	}
}
