import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	buttonStyle,
} from '@expo/ui/swift-ui/modifiers'

/**
 * `@expo/ui` does not re-export `ModifierConfig` from its public entry, and its
 * deeper path is not in the package's `exports`, so the type is derived from a
 * modifier that is public.
 */
type Modifier = ReturnType<typeof buttonStyle>

/**
 * How a filter's trigger looks and sounds when its filter is on.
 *
 * `borderedProminent` is SwiftUI's own emphasis for a control that is on, so it
 * tracks the system accent colour, light and dark mode, and contrast settings
 * without being told; a hardcoded tint would follow none of them.
 * `isSelected` states the same fact to VoiceOver, set alongside the visual
 * treatment so the two cannot drift apart.
 *
 * Shared, because both trigger shapes must be indistinguishable: a menu-shaped
 * filter's trigger is its `Menu`'s own label, a sheet-shaped one's is the
 * `Button` anchoring its sheet, and they sit side by side in one scroller.
 *
 * Hoisted so their entries are built once rather than per filter --
 * `triggerModifiers` spreads them into the array it returns.
 */
export const INACTIVE_TRIGGER_MODIFIERS: Modifier[] = [buttonStyle('bordered')]

export const ACTIVE_TRIGGER_MODIFIERS: Modifier[] = [
	buttonStyle('borderedProminent'),
	accessibilityAddTraits(['isSelected']),
]

/**
 * Names a trigger for the UI tests, which cannot go by the visible title: the
 * sheet a trigger opens states the same title in its section header, and a
 * `Menu`'s trigger reports its label twice over.
 *
 * Mirrored by `TestIdentifiers.Filter.triggerPrefix` in
 * `uitests/TestIdentifiers.swift`.
 */
export const FILTER_TRIGGER_PREFIX = 'filter-trigger-'

/**
 * The modifiers a trigger carries, for a filter that is or is not narrowing
 * anything. Call sites memoize the result on `isActive` and `key`, since the
 * identifier makes a per-filter array unavoidable.
 */
export function triggerModifiers(isActive: boolean, key: string): Modifier[] {
	return [
		...(isActive ? ACTIVE_TRIGGER_MODIFIERS : INACTIVE_TRIGGER_MODIFIERS),
		accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}${key}`),
	]
}
