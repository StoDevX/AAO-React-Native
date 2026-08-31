import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	buttonStyle,
	disabled,
	foregroundStyle,
	tint,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

/**
 * `@expo/ui` does not re-export `ModifierConfig` from its public entry, and its
 * deeper path is not in the package's `exports`, so the type is derived from a
 * modifier that is public.
 */
type Modifier = ReturnType<typeof buttonStyle>

/**
 * How a filter's trigger looks and sounds, on and off.
 *
 * Every trigger is a filled capsule: blue with a white label when the filter
 * narrows something, `systemFill` with the ordinary label colour when it does
 * not. The label colour has to move with the tint -- `borderedProminent` draws
 * its label white whatever it sits on, and white on `systemFill` is unreadable
 * in light mode. Both fills are `PlatformColor`s, so they track light and dark
 * mode and increased contrast.
 *
 * The style stays `borderedProminent` in both states, and that is load-bearing
 * rather than cosmetic. Changing `buttonStyle` on the first tick rebuilds the
 * SwiftUI view and dismisses an open `Menu` with it -- so a list filter closed
 * the moment its first option was chosen, then behaved on reopen, since no
 * later tick changes the style. Verified on the simulator, in both directions:
 * `testMenuStaysOpenOnTheFirstSelection` fails with a `buttonStyle` swap here
 * and passes with a `tint` one.
 *
 * `isSelected` states the same fact to VoiceOver, set alongside the visual
 * treatment so the two cannot drift apart.
 *
 * Shared, because every trigger shape must be indistinguishable: a menu-shaped
 * filter's trigger is its `Menu`'s own label, a sheet-shaped one's is the
 * `Button` anchoring its sheet, a toggle's is the control itself, and they sit
 * side by side in one scroller.
 */
function activeTreatment(isActive: boolean): Modifier[] {
	return [
		buttonStyle('borderedProminent'),
		tint(isActive ? c.systemBlue : c.systemFill),
		foregroundStyle(isActive ? c.white : c.label),
		accessibilityAddTraits(isActive ? ['isSelected'] : []),
	]
}

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
 *
 * `isDisabled` keeps a filter in the toolbar while this meal or feed gives it
 * nothing to act on. It stays drawn, greyed by SwiftUI's own disabled
 * treatment, rather than vanishing -- a control that disappears takes the
 * reader's ability to undo it with it.
 */
export function triggerModifiers(
	isActive: boolean,
	key: string,
	{isDisabled = false} = {},
): Modifier[] {
	return [
		...activeTreatment(isActive),
		...(isDisabled ? [disabled(true)] : []),
		accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}${key}`),
	]
}
