import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/**
 * `@expo/ui/swift-ui` cannot be loaded under Jest -- it reaches
 * expo-modules-core's native bindings, absent from the test runtime. This
 * stand-in covers only what `NewsList`'s filter renders as: the Categories
 * list here never reaches 12 options, so it is always a `Menu`, never the
 * sheet. `filter-toolbar-button.tsx` still imports `filter-sheet.tsx`
 * unconditionally, though, and that file calls a handful of `.../modifiers`
 * functions at module scope -- so those need real (if inert) stand-ins too,
 * even though nothing here ever renders what they decorate.
 *
 * Deliberately narrow, matching `@frogpond/filter`'s own test mock: it
 * exports what this module imports and nothing else.
 */

type Modifier = {$type: string; [key: string]: unknown}
type WithChildren = {children?: React.ReactNode}
type WithModifiers = WithChildren & {modifiers?: Modifier[]}

/**
 * `View` has no real `modifiers` prop; this cast lets `Menu` stash the array
 * on it anyway, purely so a test can read `.props.modifiers` straight off
 * the host node found by `testID`.
 */
const ViewWithModifiers = View as unknown as React.ComponentType<WithModifiers & {testID?: string}>

export const buttonStyle = (style: string): Modifier => ({$type: 'buttonStyle', style})
export const accessibilityAddTraits = (traits: string[]): Modifier => ({
	$type: 'accessibilityAddTraits',
	traits,
})
export const accessibilityIdentifier = (identifier: string): Modifier => ({
	$type: 'accessibilityIdentifier',
	identifier,
})
export const contentShape = (shape: unknown): Modifier => ({$type: 'contentShape', shape})
export const shapes = {rectangle: (): Modifier => ({$type: 'rectangle'})}
export const resizable = (): Modifier => ({$type: 'resizable'})
export const frame = (params: Record<string, unknown> = {}): Modifier => ({
	$type: 'frame',
	...params,
})
export const font = (params: Record<string, unknown> = {}): Modifier => ({$type: 'font', ...params})
export const foregroundStyle = (style: unknown): Modifier => ({$type: 'foregroundStyle', style})

export function Host({children}: WithChildren & {matchContents?: boolean}): React.ReactNode {
	return <View>{children}</View>
}

/** Every `FilterMenu` branch wraps its items in one, so this has to exist for
 * any menu-shaped filter to render at all, even though nothing here reads its
 * title. */
export function Section({children}: WithChildren & {title?: string}): React.ReactNode {
	return <View>{children}</View>
}

/**
 * `label` may legitimately be a string -- `MenuProps.label` is documented as
 * `string | ReactNode`, and a string there is the trigger text, not a slot
 * bug. `children` may not.
 */
export function Menu({
	label,
	modifiers,
	children,
}: WithModifiers & {label: string | React.ReactNode}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Menu children must be nested elements, not a plain string')
	}

	return (
		<ViewWithModifiers
			modifiers={modifiers}
			testID={typeof label === 'string' ? `menu:${label}` : undefined}
		>
			{typeof label === 'string' ? <RNText>{label}</RNText> : label}
			{children}
		</ViewWithModifiers>
	)
}

/**
 * A `Toggle` inside a `Menu` is how this codebase draws a checked menu item --
 * the platform supplies the checkmark, so the mock only needs to report the
 * label and forward the flipped state.
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
