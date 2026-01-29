import type MyPlugin from "../main";
import { MarkdownView } from "obsidian";
import { Compartment, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { buildPrivacyExtension } from "./cm6/PrivacyExtension";

type ApplyReason = "startup" | "command" | "settings-change";

export class PrivacyController {
  private plugin: MyPlugin;

  private enabled: boolean;

  private compartment = new Compartment();
  private baseExtension: Extension;

  constructor(plugin: MyPlugin) {
    this.plugin = plugin;
    this.enabled = plugin.settings.enabled;

    // Register ONE editor extension, and reconfigure it via a Compartment.
    this.baseExtension = this.compartment.of(
      buildPrivacyExtension({
        enabled: this.enabled,
        settings: this.plugin.settings,
      })
    );

    this.plugin.registerEditorExtension(this.baseExtension);

    // Re-apply when switching panes/notes
    const off1 = this.plugin.app.workspace.on("active-leaf-change", () => this.apply("settings-change"));
    const off2 = this.plugin.app.workspace.on("layout-change", () => this.apply("settings-change"));
    this.plugin.register(() => this.plugin.app.workspace.offref(off1));
    this.plugin.register(() => this.plugin.app.workspace.offref(off2));
  }

  dispose() {
    // Obsidian will clean up registered editor extensions automatically.
    // If you later add manual listeners in CM land, clean them there.
  }

  syncFromSettings(opts: { reason: ApplyReason }) {
    this.enabled = this.plugin.settings.enabled;
    this.apply(opts.reason);
  }

  toggleEnabled() {
    this.setEnabled(!this.enabled);
  }

  setEnabled(next: boolean) {
    if (this.enabled === next) return;

    this.enabled = next;
    this.plugin.settings.enabled = next;
    void this.plugin.saveSettings();

    this.apply("command");
  }

  onSettingsChanged() {
    // Settings tab saved something — push updated config
    this.apply("settings-change");
  }

  private apply(_reason: ApplyReason) {
    // Reconfigure every active CM6 editor view
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

  /**
   * Obsidian's Editor is wrapped; in CM6 it usually exposes `.cm` as EditorView.
   * This is the common plugin pattern.
   */
  private getEditorView(view: MarkdownView): EditorView | null {
    const editorAny = view.editor as any;
    const cm = editorAny?.cm;
    return cm ?? null;
  }
}
