import type { TextHiderPluginSettings } from "../../settings/types";
import { buildScreenTintBackground, shouldShowScreenTint } from "./style";

export class ScreenTintController {
	private readonly element: HTMLElement;

	constructor(document: Document) {
		this.element = document.body.createDiv({ cls: "text-hider-screen-tint" });
	}

	sync(enabled: boolean, settings: TextHiderPluginSettings): void {
		const active = shouldShowScreenTint(enabled, settings);
		this.element.toggleClass("is-active", active);
		this.element.style.background = active ? buildScreenTintBackground(settings) : "";
	}

	destroy(): void {
		this.element.remove();
	}
}
