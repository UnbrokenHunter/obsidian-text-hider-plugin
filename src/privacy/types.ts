export type ApplyReason =
	| "startup"
	| "command"
	| "settings-change"
	| "active-editor-change"
	| "cursor-move"
	| "selection-change"
	| "unknown";

export interface SetEnabledOptions {
	/** If true, write back to settings.enabled */
	persist?: boolean;
	reason?: ApplyReason;
}
