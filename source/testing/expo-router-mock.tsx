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
		/// A toolbar menu, or a titled group inside one: a view carrying its label, then its title
		/// as text a query can read, then its items. Nothing opens or closes here; every item is
		/// always on hand to press.
		Menu: (props: {accessibilityLabel?: string; title?: string; children?: React.ReactNode}) => {
			// oxlint-disable-next-line typescript/no-require-imports
			let {Text, View} = require('react-native')
			return (
				<View accessibilityLabel={props.accessibilityLabel}>
					{props.title ? <Text>{props.title}</Text> : null}
					{props.children}
				</View>
			)
		},
		/// A menu's item: a `menuitem` a query can press, checked as `isOn` says.
		MenuAction: (props: {isOn?: boolean; onPress?: () => void; children?: React.ReactNode}) => {
			// oxlint-disable-next-line typescript/no-require-imports
			let {Pressable, Text} = require('react-native')
			return (
				<Pressable
					accessibilityRole="menuitem"
					accessibilityState={{checked: Boolean(props.isOn)}}
					onPress={props.onPress}
				>
					<Text>{props.children}</Text>
				</Pressable>
			)
		},
		/// A flexible gap between toolbar items; there is nothing to lay out here.
		Spacer: () => null,
		/// Hosts a custom view in the toolbar, so the view itself renders.
		View: ({children}: {children?: React.ReactNode}) => children ?? null,
	}),
})

/// Every focus effect currently mounted, with its last cleanup. The campus
/// report form resets its Add Link guard on focus, so a test needs a way to
/// say "the reader came back to this screen".
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

/// What every stand-in hook's actions do: nothing.
const noop = (): void => undefined

/// The hooks a screen reads, answering as a screen focused at the top of a
/// stack with no params would. They do nothing, so every test can render a
/// screen without a navigator; a test that checks where a screen goes, or what
/// it was given, replaces the hook in its own `jest.mock('expo-router')`.
export function useRouter(): Record<
	'navigate' | 'push' | 'replace' | 'back' | 'dismiss',
	() => void
> {
	return {navigate: noop, push: noop, replace: noop, back: noop, dismiss: noop}
}

export function useNavigation(): Record<'goBack' | 'dispatch' | 'setOptions', () => void> {
	return {goBack: noop, dispatch: noop, setOptions: noop}
}

export function useLocalSearchParams(): Record<string, string> {
	return {}
}

export function useIsFocused(): boolean {
	return true
}

export function useSegments(): string[] {
	return []
}
