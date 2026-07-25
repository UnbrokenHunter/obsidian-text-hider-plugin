import type MyPlugin from "../main";
import { MarkdownView } from "obsidian";
import { Compartment, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { buildPrivacyExtension } from "./cm6/PrivacyExtension";
import type { ApplyReason, SetEnabledOptions } from "./types";
import { ScreenTintController } from "./screen-tint/ScreenTintController";
import {
  getReadingImageHandlingClasses,
  READING_IMAGE_HANDLING_CLASSES,
} from "./reading-view/imageClasses";
import type { ContentHandlingMode } from "../settings/types";

const READING_MASK_CLASS = "privacy-reading-mask";
const READING_VIEW_CLASS = "privacy-reading-view-enabled";
const READING_HIDE_CALLOUTS_CLASS = "privacy-reading-callouts-hidden";
const READING_HIDE_HEADERS_CLASS = "privacy-reading-headers-hidden";
const READING_EXCLUDED_SELECTOR = "script, style, textarea, input, button, select, option, svg";

export class PrivacyController {
  private plugin: MyPlugin;
  private enabled: boolean;
  private compartment = new Compartment();
  private baseExtension: Extension;
  private statusEl: HTMLElement;
  private screenTint: ScreenTintController;

  constructor(plugin: MyPlugin) {
    this.plugin = plugin;
    this.enabled = plugin.settings.enabled;
    this.baseExtension = this.compartment.of(
      buildPrivacyExtension({
        enabled: this.enabled,
        settings: this.plugin.settings,
      })
    );

    this.plugin.registerEditorExtension(this.baseExtension);
    this.screenTint = new ScreenTintController(document);
    this.statusEl = this.plugin.addStatusBarItem();
    this.statusEl.addClass("privacy-status-indicator");
    this.statusEl.setAttribute("role", "button");
    this.statusEl.setAttribute("tabindex", "0");
    this.plugin.registerDomEvent(this.statusEl, "click", () => this.toggleEnabled());
    this.plugin.registerDomEvent(this.statusEl, "keydown", (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      this.toggleEnabled();
    });

    this.plugin.registerMarkdownPostProcessor((element) => {
      if (this.shouldMaskReadingView()) this.maskReadingContent(element);
    });

    const offActiveLeaf = this.plugin.app.workspace.on("active-leaf-change", () => this.apply("active-editor-change"));
    const offLayout = this.plugin.app.workspace.on("layout-change", () => this.apply("active-editor-change"));
    this.plugin.register(() => this.plugin.app.workspace.offref(offActiveLeaf));
    this.plugin.register(() => this.plugin.app.workspace.offref(offLayout));
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

  updateScreenTint() {
    this.syncScreenTint();
  }

  destroy() {
    this.syncReadingViews(false, false, false, "exclude");
    this.syncNoteTitles(false);
    this.screenTint.destroy();
    this.statusEl.remove();
  }

  private apply(_reason: ApplyReason) {
    const extension = buildPrivacyExtension({
      enabled: this.enabled,
      settings: this.plugin.settings,
    });
    const effect = this.compartment.reconfigure(extension);

    for (const view of this.getAllMarkdownViews()) {
      const editorView = this.getEditorView(view);
      if (editorView) editorView.dispatch({ effects: effect });
    }

    this.syncReadingViews(this.shouldMaskReadingView(), this.shouldHideCallouts(), this.shouldHideHeaders(), this.getReadingImageMode());
    this.syncNoteTitles();
    this.syncScreenTint();
    this.updateStatusIndicator();
  }

  private shouldMaskReadingView(): boolean {
    return this.enabled && this.plugin.settings.maskReadingView;
  }

  private shouldHideCallouts(): boolean {
    return this.enabled && this.plugin.settings.calloutMode === "hide";
  }

  private shouldHideHeaders(): boolean {
    return this.enabled && this.plugin.settings.headerMode === "hide";
  }

  private getReadingImageMode(): ContentHandlingMode {
    return this.shouldMaskReadingView() ? this.plugin.settings.imageMode : "exclude";
  }
  private syncNoteTitles(enabled = this.enabled) {
    const maskTitle = enabled && this.plugin.settings.titleMode === "mask";
    const hideTitle = enabled && this.plugin.settings.titleMode === "hide";

    for (const view of this.getAllMarkdownViews()) {
      const titleRoot = view.contentEl;
      titleRoot.toggleClass("text-hider-note-title-masked", maskTitle);
      titleRoot.toggleClass("text-hider-note-title-hidden", hideTitle);
      titleRoot.toggleClass("text-hider-note-title-mask-hide", maskTitle && this.plugin.settings.maskMode === "hide");
      titleRoot.toggleClass("text-hider-note-title-mask-password", maskTitle && this.plugin.settings.maskMode === "password");
      titleRoot.toggleClass("text-hider-note-title-mask-blur", maskTitle && this.plugin.settings.maskMode === "blur");
    }
  }

  private syncScreenTint() {
    this.screenTint.sync(this.enabled, this.plugin.settings);
  }
  private syncReadingViews(mask: boolean, hideCallouts: boolean, hideHeaders: boolean, imageMode: ContentHandlingMode) {
    for (const view of this.getAllMarkdownViews()) {
      if (view.getMode() !== "preview") continue;
      this.syncReadingView(view.previewMode.containerEl, mask, hideCallouts, hideHeaders, imageMode);
    }
  }

  private syncReadingView(container: HTMLElement, mask: boolean, hideCallouts: boolean, hideHeaders: boolean, imageMode: ContentHandlingMode) {
    container.toggleClass(READING_VIEW_CLASS, mask);
    container.toggleClass(READING_HIDE_CALLOUTS_CLASS, hideCallouts);
    container.toggleClass(READING_HIDE_HEADERS_CLASS, hideHeaders);
    this.syncReadingImageHandling(container, imageMode);

    if (!mask) {
      container.style.removeProperty("--text-hider-blur-strength");
      this.unmaskReadingContent(container);
      return;
    }

    container.style.setProperty("--text-hider-blur-strength", `${this.plugin.settings.blurStrength}px`);
    this.updateReadingMaskClasses(container);
    this.maskReadingContent(container);
  }

  private syncReadingImageHandling(container: HTMLElement, imageMode: ContentHandlingMode): void {
    const activeClasses = new Set(getReadingImageHandlingClasses(imageMode, this.plugin.settings.maskMode));
    for (const className of READING_IMAGE_HANDLING_CLASSES) {
      container.toggleClass(className, activeClasses.has(className));
    }
  }

  private maskReadingContent(root: HTMLElement) {
    const nodeFilter = root.ownerDocument.defaultView?.NodeFilter;
    if (!nodeFilter) return;

    const walker = root.ownerDocument.createTreeWalker(root, nodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === 3 && this.canMaskReadingText(node as Text)) textNodes.push(node as Text);
    }

    for (const textNode of textNodes) {
      const parent = textNode.parentElement;
      if (!parent) continue;

      const span = root.ownerDocument.createElement("span");
      span.className = `${READING_MASK_CLASS} ${this.getReadingMaskClass()}`;
      parent.replaceChild(span, textNode);
      span.appendChild(textNode);
    }
  }

  private canMaskReadingText(textNode: Text): boolean {
    if (!textNode.data.trim()) return false;

    const parent = textNode.parentElement;
    if (!parent) return false;
    if (parent.closest(`.${READING_MASK_CLASS}`)) return false;
    if (parent.closest(READING_EXCLUDED_SELECTOR)) return false;
    if (this.plugin.settings.headerMode === "exclude" && parent.closest("h1, h2, h3, h4, h5, h6")) return false;
    if (this.plugin.settings.calloutMode === "exclude" && parent.closest(".callout")) return false;

    return true;
  }

  private updateReadingMaskClasses(root: HTMLElement) {
    for (const span of this.getReadingMaskSpans(root)) {
      span.className = `${READING_MASK_CLASS} ${this.getReadingMaskClass()}`;
    }
  }

  private getReadingMaskSpans(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(`.${READING_MASK_CLASS}`));
  }
  private unmaskReadingContent(root: HTMLElement) {
    for (const span of this.getReadingMaskSpans(root)) {
      span.replaceWith(...Array.from(span.childNodes));
    }
    root.normalize();
  }

  private getReadingMaskClass(): string {
    if (this.plugin.settings.maskMode === "hide") return "privacy-reading-mask-hide";
    if (this.plugin.settings.maskMode === "password") return "privacy-reading-mask-password";
    return "privacy-reading-mask-blur";
  }

  private updateStatusIndicator() {
    const isVisible = this.plugin.settings.showStatusBar;
    this.statusEl.hidden = !isVisible;
    this.statusEl.toggleClass("is-active", this.enabled);
    this.statusEl.setText(`Text Hider: ${this.enabled ? "On" : "Off"}`);
    this.statusEl.setAttribute("aria-label", "Toggle privacy mode");
    this.statusEl.setAttribute("title", `Text Hider is ${this.enabled ? "on" : "off"}. Select to toggle.`);
  }

  private *getAllMarkdownViews(): Iterable<MarkdownView> {
    const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      if (leaf.view instanceof MarkdownView) yield leaf.view;
    }
  }

  private getEditorView(view: MarkdownView): EditorView | null {
    return getEditorViewFromObsidianEditor(view.editor);
  }
}

function getEditorViewFromObsidianEditor(editor: unknown): EditorView | null {
  if (!editor || typeof editor !== "object") return null;

  const maybeEditor = editor as { cm?: unknown };
  const editorView = maybeEditor.cm;
  return editorView && typeof editorView === "object" && "state" in editorView
    ? (editorView as EditorView)
    : null;
}
