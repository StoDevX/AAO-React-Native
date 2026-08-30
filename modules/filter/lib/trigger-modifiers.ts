import {accessibilityAddTraits, buttonStyle} from '@expo/ui/swift-ui/modifiers'

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
 * Hoisted so a render reuses these arrays rather than allocating per filter.
 */
export const INACTIVE_TRIGGER_MODIFIERS: Modifier[] = [buttonStyle('bordered')]

export const ACTIVE_TRIGGER_MODIFIERS: Modifier[] = [
	buttonStyle('borderedProminent'),
	accessibilityAddTraits(['isSelected']),
]

export function triggerModifiers(isActive: boolean): Modifier[] {
	return isActive ? ACTIVE_TRIGGER_MODIFIERS : INACTIVE_TRIGGER_MODIFIERS
}
