import { WidgetType } from "@codemirror/view";

export class MaskWidget extends WidgetType {
  constructor(private length: number, private mode: "hide" | "asterisks") {
    super();
  }

  eq(other: MaskWidget) {
    return other.length === this.length && other.mode === this.mode;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "privacy-mask-widget";

    if (this.mode === "asterisks") {
      // Option A: constant "*****"
      // span.textContent = "*****";

      // Option B (better UX): same-length masking
      span.textContent = "*".repeat(Math.min(this.length, 2000));
    } else {
      // "hide" but preserve layout width somewhat by replacing with spaces.
      // This keeps cursor alignment more stable than empty.
      span.textContent = " ".repeat(Math.min(this.length, 2000));
    }

    return span;
  }

  ignoreEvent() {
    return false;
  }
}
