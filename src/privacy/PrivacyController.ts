import type MyPlugin from "../main";
import { MarkdownView } from "obsidian";
import { Compartment, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { buildPrivacyExtension } from "./cm6/PrivacyExtension";
import type { ApplyReason, SetEnabledOptions } from "./types";

export class PrivacyController {
  private plugin: MyPlugin;

  private enabled: boolean;

  private compartment = new Compartment();
  private baseExtension: Extension;

  constructor(plugin: MyPlugin) {
    this.plugin = plugin;
    this.enabled = plugin.settings.enabled;

    // Register one editor extension, then reconfigure it through a compartment.
    this.baseExtension = this.compartment.of(
      buildPrivacyExtension({
        enabled: this.enabled,
        settings: this.plugin.settings,
      })
    );

    this.plugin.registerEditorExtension(this.baseExtension);

    const off1 = this.plugin.app.workspace.on("active-leaf-change", () => this.apply("active-editor-change"));
    const off2 = this.plugin.app.workspace.on("layout-change", () => this.apply("active-editor-change"));
    this.plugin.register(() => this.plugin.app.workspace.offref(off1));
    this.plugin.register(() => this.plugin.app.workspace.offref(off2));
  }

  syncFromSettings(opts: { reason: ApplyReason }) {
    this.enabled = this.plugin.settings.enabled;
    this.apply(opts.reason);
  }

  toggleEnabled() {
    this.setEnabled(!this.enabled);
  }

  setEnabled(next: boolean, opts: SetEnabledOptions = {}) {
    if (this.enabled === next) return;

    this.enabled = next;
    if (opts.persist ?? true) {
      this.plugin.settings.enabled = next;
      void this.plugin.saveSettings();
    }

    this.apply(opts.reason ?? "command");
  }

  onSettingsChanged() {
    this.enabled = this.plugin.settings.enabled;
    this.apply("settings-change");
  }

  private apply(_reason: ApplyReason) {
    const ext = buildPrivacyExtension({
      enabled: this.enabled,
      settings: this.plugin.settings,
    });

    const effect = this.compartment.reconfigure(ext);

    for (const view of this.getAllMarkdownEditorViews()) {
      const cm = this.getEditorView(view);
      if (!cm) continue;
      cm.dispatch({ effects: effect });
    }
  }

  private *getAllMarkdownEditorViews(): Iterable<MarkdownView> {
    const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof MarkdownView) yield view;
    }
  }

  private getEditorView(view: MarkdownView): EditorView | null {
    return getEditorViewFromObsidianEditor(view.editor);
  }
}

function getEditorViewFromObsidianEditor(editor: unknown): EditorView | null {
  if (!editor || typeof editor !== "object") return null;

  const maybe = editor as { cm?: unknown };
  const cm = maybe.cm;

  if (cm && typeof cm === "object" && "state" in cm) {
    return cm as EditorView;
  }
  return null;
}
