import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	buttonStyle,
	disabled,
	menuIndicator,
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
 * Shared, because every trigger shape must be indistinguishable: a menu-shaped
 * filter's trigger is its `Menu`'s own label, a sheet-shaped one's is the
 * `Button` anchoring its sheet, a toggle's is the control itself, and they sit
 * side by side in one scroller.
 *
 * Hoisted so their entries are built once rather than per filter --
 * `triggerModifiers` spreads them into the array it returns.
 */
const INACTIVE_TRIGGER_MODIFIERS: Modifier[] = [buttonStyle('bordered')]

const ACTIVE_TRIGGER_MODIFIERS: Modifier[] = [
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
 * SwiftUI's own disclosure chevron, which a `Menu` draws from this rather than
 * from anything we compose into its label. Drawing one by hand would mean
 * handing the trigger a view instead of a string, and a view-labelled control
 * inside a `Host matchContents` is drawn but not hittable -- verified on the
 * simulator, where every such trigger failed `.tap()` while reporting a correct
 * frame.
 */
const MENU_INDICATOR: Modifier[] = [menuIndicator('visible')]

/**
 * The modifiers a trigger carries, for a filter that is or is not narrowing
 * anything. Call sites memoize the result on `isActive` and `key`, since the
 * identifier makes a per-filter array unavoidable.
 *
 * `presents` asks for the chevron that says the trigger opens something. A
 * toggle passes `false`: its trigger is the control, and nothing opens.
 *
 * `isDisabled` keeps a filter in the toolbar while this meal or feed gives it
 * nothing to act on. It stays drawn, greyed by SwiftUI's own disabled
 * treatment, rather than vanishing -- a control that disappears takes the
 * reader's ability to undo it with it.
 */
export function triggerModifiers(
	isActive: boolean,
	key: string,
	{presents = true, isDisabled = false} = {},
): Modifier[] {
	return [
		...(isActive ? ACTIVE_TRIGGER_MODIFIERS : INACTIVE_TRIGGER_MODIFIERS),
		...(presents ? MENU_INDICATOR : []),
		...(isDisabled ? [disabled(true)] : []),
		accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}${key}`),
	]
}
