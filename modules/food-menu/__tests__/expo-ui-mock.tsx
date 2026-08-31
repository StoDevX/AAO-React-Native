import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

const modifier =
	($type: string) =>
	(value?: unknown): Modifier => ({$type, value})

export const accessibilityAddTraits = modifier('accessibilityAddTraits')
export const accessibilityIdentifier = modifier('accessibilityIdentifier')
export const accessibilityLabel = modifier('accessibilityLabel')
export const aspectRatio = modifier('aspectRatio')
export const background = modifier('background')
export const buttonStyle = modifier('buttonStyle')
export const contentShape = modifier('contentShape')
export const font = modifier('font')
export const foregroundStyle = modifier('foregroundStyle')
export const frame = modifier('frame')
export const kerning = modifier('kerning')
export const lineLimit = modifier('lineLimit')
export const listRowInsets = modifier('listRowInsets')
export const listStyle = modifier('listStyle')
export const minimumScaleFactor = modifier('minimumScaleFactor')
export const monospacedDigit = modifier('monospacedDigit')
export const multilineTextAlignment = modifier('multilineTextAlignment')
export const padding = modifier('padding')
export const refreshable = modifier('refreshable')
export const resizable = modifier('resizable')
export const textSelection = modifier('textSelection')

export const shapes = {
	rectangle: () => ({type: 'rectangle'}) as const,
	circle: () => ({type: 'circle'}) as const,
}

/**
 * An `accessibilityLabel` modifier overrides whatever a component would
 * otherwise announce -- `food-item-row.tsx`'s `Button` uses one to read the
 * dietary tags a bare label/children wouldn't mention. `Button` below prefers
 * this over its own `label` prop for the same reason the real component does:
 * the modifier is the explicit override.
 */
function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return found?.value as string | undefined
}

/**
 * `View` has no real `onPress` or `accessibilityRole` prop; this cast lets
 * `Menu` and `Button` stash them on it anyway, so a test can find a control by
 * role or `testID` and press it via `fireEvent.press`.
 */
const ViewWithModifiers = View as unknown as React.ComponentType<
	WithModifiers & {
		accessible?: boolean
		accessibilityLabel?: string
		accessibilityRole?: string
		onPress?: () => void
		testID?: string
	}
>

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
export function Spacer(): React.ReactNode {
	return <View />
}
// A sheet-shaped filter draws its header in a `ZStack`, layering the title
// over the button row. This screen's tests never open a sheet, but building
// one still walks the header, so the stand-in has to exist.
export function ZStack({children}: WithModifiers & {alignment?: string}): React.ReactNode {
	return <View>{children}</View>
}
export function Text({children}: WithModifiers): React.ReactNode {
	return <RNText>{children}</RNText>
}
export function RNHostView({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
/**
 * `title` renders as text so a test can assert a section is present. `header`
 * and `footer` are real `SwiftUIContent` slots on the native component -- a
 * bare string handed to either crashes at mount -- but react-test-renderer
 * happily accepts a raw string child of `View`, so rendering it wouldn't catch
 * that. The throws below are what earn the claim.
 */
export function Section({
	title,
	header,
	footer,
	children,
}: WithModifiers & {
	title?: string
	header?: React.ReactNode
	footer?: React.ReactNode
}): React.ReactNode {
	if (typeof header === 'string') {
		throw new Error('Section header is a SwiftUI slot; a bare string crashes at mount')
	}

	if (typeof footer === 'string') {
		throw new Error('Section footer is a SwiftUI slot; a bare string crashes at mount')
	}

	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{header}
			{children}
			{footer}
		</View>
	)
}
export function List({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
List.ForEach = function ListForEach({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}
/**
 * Keeps `anchor` mounted regardless of `isPresented` (it's the trigger,
 * rendered in place -- `filter-sheet.tsx` relies on that so the anchor
 * `Button` survives a dismiss) and mounts `children` only while presented,
 * matching the real component -- `filter-sheet.tsx` relies on that to keep a
 * closed sheet's rows out of the tree.
 */
export function BottomSheet({
	anchor,
	children,
	isPresented,
}: WithModifiers & {
	anchor?: React.ReactNode
	isPresented: boolean
	onDismiss?: () => void
	onIsPresentedChange?: (isPresented: boolean) => void
}): React.ReactNode {
	return (
		<View>
			{anchor}
			{isPresented ? children : null}
		</View>
	)
}
/**
 * `label` may legitimately be a string -- `MenuProps.label` is documented as
 * `string | ReactNode`, and a string there is the trigger text, not a slot
 * bug. `children` may not, so the throw below mirrors that constraint.
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
}: WithModifiers & {
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
 * `children` must be nested elements, not a plain string: the throw below
 * mirrors that constraint instead of silently accepting what the real
 * component would reject. `label` is a `Button` used as `BottomSheet`'s
 * `anchor`'s own text -- the same contract `Menu.label` has -- so absent an
 * `accessibilityLabel` modifier override (`labelOf`), it becomes the
 * accessible name too (`getByRole('button', {name})` finds it), with
 * `modifiers` stashed on the same host node so a test can compare it against
 * `FilterMenu`'s trigger by identity.
 */
export function Button({
	children,
	label,
	modifiers,
	onPress,
}: WithModifiers & {label?: string; onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	let accessibleName = labelOf(modifiers) ?? label

	return (
		<ViewWithModifiers
			accessibilityLabel={accessibleName}
			accessibilityRole="button"
			// `RNTL`'s `getByRole` only considers an element an accessibility
			// element -- and so a candidate at all -- once `accessible` is
			// explicitly set; a bare `View` (what this cast really is) defaults to
			// `false`, unlike a real `Button`'s native host view.
			accessible={true}
			modifiers={modifiers}
			onPress={onPress}
			testID={label ? `button:${label}` : undefined}
		>
			{children ?? (label ? <RNText>{label}</RNText> : null)}
		</ViewWithModifiers>
	)
}
/** `uiImage` is a local path; the mock only records that one was asked for. */
export function Image({
	uiImage,
	systemName,
}: {
	uiImage?: string
	systemName?: string
}): React.ReactNode {
	return <View testID={uiImage ? `icon-${uiImage}` : `symbol-${systemName}`} />
}
export const menuIndicator = (visibility: string): Modifier => ({
	$type: 'menuIndicator',
	visibility,
})
export const disabled = (isDisabled?: boolean): Modifier => ({$type: 'disabled', isDisabled})
export const menuActionDismissBehavior = (behavior: string): Modifier => ({
	$type: 'menuActionDismissBehavior',
	behavior,
})
export const tint = (color: unknown): Modifier => ({$type: 'tint', color})
export const environment = (config: Record<string, unknown>): Modifier => ({
	$type: 'environment',
	...config,
})
export const tag = (value: string | number): Modifier => ({$type: 'tag', value})
