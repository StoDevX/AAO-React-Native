import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/**
 * `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
 * reaches expo-modules-core's native bindings, which do not exist in the test
 * runtime -- so a component that renders SwiftUI is untestable without a
 * stand-in. This one covers the views `filter-menu.tsx` and `filter-sheet.tsx`
 * use, rendering each as the React Native view closest to what it does
 * natively. It doubles as the mock for `@expo/ui/swift-ui/modifiers`, the way
 * `building-picker`'s mock does, since `filter-sheet.tsx` imports from both.
 *
 * Deliberately narrow, matching the event-list feature's mock: it exports
 * what this module imports and nothing else, rather than pretending to be
 * the whole module.
 */

type Modifier = {$type: string; [key: string]: unknown}
type WithChildren = {children?: React.ReactNode}
type WithModifiers = WithChildren & {modifiers?: Modifier[]}

export const buttonStyle = (style: string): Modifier => ({$type: 'buttonStyle', style})

export const contentShape = (shape: unknown): Modifier => ({$type: 'contentShape', shape})

export const shapes = {rectangle: (): Modifier => ({$type: 'rectangle'})}

export const resizable = (): Modifier => ({$type: 'resizable'})

export const frame = (params: Record<string, unknown> = {}): Modifier => ({
	$type: 'frame',
	...params,
})

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

/**
 * The real `BottomSheet` keeps `anchor` mounted regardless of `isPresented`
 * (it's the trigger, rendered in place) and mounts `children` only while
 * presented -- this mirrors both. The dismiss trigger fires `onIsPresentedChange`
 * and `onDismiss` together; real `filter-sheet.tsx` only wires the former
 * (see its comment for why), so in practice only one call does anything, but
 * both fire here since `BottomSheetProps.onDismiss` is real and a future
 * caller may wire it.
 */
export function BottomSheet({
	anchor,
	children,
	isPresented,
	onDismiss,
	onIsPresentedChange,
}: WithChildren & {
	anchor?: React.ReactNode
	isPresented: boolean
	onDismiss?: () => void
	onIsPresentedChange?: (isPresented: boolean) => void
}): React.ReactNode {
	if (typeof anchor === 'string') {
		throw new Error('BottomSheet anchor is a SwiftUI slot; a bare string crashes at mount')
	}

	return (
		<View>
			{anchor}
			{isPresented ? (
				<View>
					<Pressable
						accessibilityLabel="Dismiss"
						onPress={() => {
							onIsPresentedChange?.(false)
							onDismiss?.()
						}}
					>
						<RNText>Dismiss</RNText>
					</Pressable>
					{children}
				</View>
			) : null}
		</View>
	)
}

export function List({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

List.ForEach = function ListForEach({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

/**
 * `header`/`footer` are real `SwiftUIContent` slots on the native component --
 * a bare string handed to either crashes at mount -- but react-test-renderer
 * happily accepts a raw string child of `View`, so rendering them wouldn't
 * catch that. The explicit throw below is what earns the claim (ported from
 * the event-list mock, this one's stated model).
 */
export function Section({
	children,
	header,
	footer,
}: WithChildren & {
	header?: React.ReactNode
	footer?: React.ReactNode
}): React.ReactNode {
	if (typeof header === 'string' || typeof footer === 'string') {
		throw new Error('Section header/footer are SwiftUI slots; a bare string crashes at mount')
	}

	return (
		<View>
			{header}
			{children}
			{footer}
		</View>
	)
}

export function HStack({children}: WithChildren & {spacing?: number}): React.ReactNode {
	return <View>{children}</View>
}

export function Spacer(): React.ReactNode {
	return null
}

export function Text({children}: WithChildren): React.ReactNode {
	return <RNText>{children}</RNText>
}

/**
 * Reports which variant fired, and with what, as an accessibility label --
 * `iconFor`'s whole contract is *which* icon a row gets, sfSymbol or
 * localFile, and this is how a test tells the two apart without a real
 * renderer.
 */
export function Image({
	systemName,
	uiImage,
}: WithModifiers & {systemName?: string; uiImage?: string; size?: number}): React.ReactNode {
	if (systemName) {
		return <View accessibilityLabel={`icon:sfSymbol:${systemName}`} />
	}
	if (uiImage) {
		return <View accessibilityLabel={`icon:localFile:${uiImage}`} />
	}
	return null
}

/**
 * `ButtonProps` documents that children must be nested elements, not plain
 * strings; the throw below mirrors that constraint instead of silently
 * accepting what the real component would reject (see the event-list mock
 * this one is modelled on).
 */
export function Button({
	children,
	onPress,
}: WithChildren & {onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	return <Pressable onPress={onPress}>{children}</Pressable>
}
