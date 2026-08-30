import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/**
 * `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
 * reaches expo-modules-core's native bindings, which do not exist in the test
 * runtime -- so a component that renders SwiftUI is untestable without a
 * stand-in. This one covers the views `filter-menu.tsx` uses, rendering each
 * as the React Native view closest to what it does natively.
 *
 * Deliberately narrow, matching the event-list feature's mock: it exports
 * what this module imports and nothing else, rather than pretending to be
 * the whole module.
 */

type WithChildren = {children?: React.ReactNode}

export function Host({children}: WithChildren & {matchContents?: boolean}): React.ReactNode {
	return <View>{children}</View>
}

/**
 * `label` may legitimately be a string -- `MenuProps.label` is documented as
 * `string | ReactNode`, and a string there is the trigger text, not a slot
 * bug. `children` may not: the real component only accepts nested elements,
 * and a raw string there crashes at mount the same way `Button`'s children
 * do (see the event-list mock this one is modelled on).
 */
export function Menu({
	label,
	children,
}: WithChildren & {label: string | React.ReactNode}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Menu children must be nested elements, not a plain string')
	}

	return (
		<View>
			{typeof label === 'string' ? <RNText>{label}</RNText> : label}
			{children}
		</View>
	)
}

/**
 * A `Toggle` inside a `Menu` is how this codebase already draws a checked
 * menu item (see the bus day picker's header menu) -- the platform supplies
 * the checkmark, so the mock only needs to report the label and forward the
 * flipped state, not paint a check glyph of its own.
 */
export function Toggle({
	label,
	isOn,
	onIsOnChange,
	children,
}: WithChildren & {
	label?: string
	isOn?: boolean
	onIsOnChange?: (isOn: boolean) => void
}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Toggle children must be nested elements, not a plain string')
	}

	return (
		<Pressable
			accessibilityRole="menuitem"
			accessibilityState={{checked: isOn}}
			onPress={() => onIsOnChange?.(!isOn)}
		>
			{children ?? (label ? <RNText>{label}</RNText> : null)}
		</Pressable>
	)
}
