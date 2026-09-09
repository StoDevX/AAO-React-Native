import * as React from 'react'

/// The `expo-router` `Stack` a dictionary screen renders through. `Title` and
/// `Screen` configure the native header/screen options the same way the real
/// components do -- they name something, rather than drawing it -- so, like
/// the real components, they render nothing into the tree under test.
/// `Toolbar.Button` stands in for a native toolbar button: a `Pressable` a
/// query can press, wrapping a `Text` a query can read its label off.
///
/// Shared rather than copied into each screen's own test file: two dictionary
/// screen tests (`edit-screen.test.tsx`, `preview-screen.test.tsx`) mock this
/// same shape, and a hand-copied mock drifts the moment one of them gains a
/// toolbar feature the other doesn't need yet.
export const Stack = Object.assign(({children}: {children?: React.ReactNode}) => children ?? null, {
	Title: () => null,
	Screen: () => null,
	Toolbar: Object.assign(({children}: {children?: React.ReactNode}) => children ?? null, {
		Button: (props: {accessibilityLabel: string; onPress: () => void; disabled?: boolean}) => {
			// oxlint-disable-next-line typescript/no-require-imports
			let {Pressable, Text} = require('react-native')
			return (
				<Pressable
					accessibilityLabel={props.accessibilityLabel}
					accessibilityState={{disabled: Boolean(props.disabled)}}
					onPress={props.onPress}
				>
					<Text>{props.accessibilityLabel}</Text>
				</Pressable>
			)
		},
	}),
})

/// Every focus effect currently mounted, with its last cleanup. `edit.tsx`
/// reconciles a sense's field against the store on focus rather than on every
/// change, so a test needs a way to say "the reader came back to this screen".
const focusEffects = new Map<() => void | (() => void), (() => void) | void>()

/// Stand-in for `expo-router`'s `useFocusEffect`. A screen under test is
/// focused from the moment it renders, so the effect runs on mount, and again
/// for each `simulateFocus()` -- there is no navigator here to fire a real
/// focus event.
export function useFocusEffect(effect: () => void | (() => void)): void {
	React.useEffect(() => {
		focusEffects.set(effect, effect())
		return () => {
			focusEffects.get(effect)?.()
			focusEffects.delete(effect)
		}
	}, [effect])
}

/// Runs every mounted focus effect again, standing in for the reader
/// returning to this screen from one pushed on top of it.
export function simulateFocus(): void {
	for (let [effect, cleanup] of focusEffects) {
		cleanup?.()
		focusEffects.set(effect, effect())
	}
}
