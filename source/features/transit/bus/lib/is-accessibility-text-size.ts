/// Midway between React Native's `fontScale` at xxxLarge, 1.353, and at the
/// smallest accessibility size, 1.786 -- see `RCTFontSizeMultiplier`.
const SMALLEST_ACCESSIBILITY_SCALE = 1.57

/**
 * Whether React Native's `fontScale` is one of the accessibility text sizes,
 * where a row too crowded to keep its parts side by side stacks them instead.
 */
export function isAccessibilityTextSize(fontScale: number): boolean {
	return fontScale >= SMALLEST_ACCESSIBILITY_SCALE
}
