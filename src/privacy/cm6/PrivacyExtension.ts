import type { Extension } from "@codemirror/state";
import { EditorView, ViewPlugin, Decoration, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import type { MyPluginSettings } from "../../settings";
import { buildMaskDecorations } from "./masking/buildMaskDecorations";

export function buildPrivacyExtension(args: { enabled: boolean; settings: MyPluginSettings }): Extension {
  const { enabled, settings } = args;

  const plugin = ViewPlugin.fromClass(
    class PrivacyMaskPlugin {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildMaskDecorations(view, enabled, settings);
      }

      update(update: ViewUpdate) {
        // If disabled, keep decorations empty.
        if (!enabled) {
          this.decorations = Decoration.none;
          return;
        }

        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildMaskDecorations(update.view, enabled, settings);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

    const theme = EditorView.baseTheme({
    ".privacy-mask-widget": {
        whiteSpace: "pre-wrap",
    },
    });

  return [plugin, theme];
}
