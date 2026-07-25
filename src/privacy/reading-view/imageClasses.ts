import type { ContentHandlingMode, MaskMode } from "../../settings/types";

const READING_IMAGE_MODE_MASK_CLASS = "privacy-reading-image-mode-mask";
const READING_IMAGE_MODE_HIDE_CLASS = "privacy-reading-image-mode-hide";
const READING_IMAGE_MASK_MODE_PREFIX = "privacy-reading-image-mask-mode-";

export const READING_IMAGE_HANDLING_CLASSES = [
	READING_IMAGE_MODE_MASK_CLASS,
	READING_IMAGE_MODE_HIDE_CLASS,
	`${READING_IMAGE_MASK_MODE_PREFIX}hide`,
	`${READING_IMAGE_MASK_MODE_PREFIX}password`,
	`${READING_IMAGE_MASK_MODE_PREFIX}blur`,
] as const;

export function getReadingImageHandlingClasses(
	imageMode: ContentHandlingMode,
	maskMode: MaskMode,
): readonly string[] {
	if (imageMode === "hide") return [READING_IMAGE_MODE_HIDE_CLASS];
	if (imageMode === "mask") {
		return [READING_IMAGE_MODE_MASK_CLASS, `${READING_IMAGE_MASK_MODE_PREFIX}${maskMode}`];
	}

	return [];
}
