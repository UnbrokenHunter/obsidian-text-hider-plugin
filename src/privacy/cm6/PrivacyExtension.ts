import type { Extension } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import type { TextHiderPluginSettings } from "../../settings";
import { buildMaskDecorations } from "./masking/buildMaskDecorations";

export function buildPrivacyExtension(args: { enabled: boolean; settings: TextHiderPluginSettings }): Extension {
  const { enabled, settings } = args;

  const editorAttrs = EditorView.editorAttributes.of({
    class: enabled ? "privacy-mode-enabled" : "",
    style: `--text-hider-blur-strength: ${settings.blurStrength}px;`,
  });

  const plugin = ViewPlugin.fromClass(
    class PrivacyMaskPlugin {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildMaskDecorations(view, enabled, settings);
      }

      update(update: ViewUpdate) {
        if (!enabled) {
          this.decorations = Decoration.none;
          return;
        }
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildMaskDecorations(update.view, enabled, settings);
        }
      }
    },
    { decorations: (view) => view.decorations }
  );

  return [editorAttrs, plugin];
}