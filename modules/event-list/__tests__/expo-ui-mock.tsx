import * as React from 'react'
import {Pressable, Text as RNText, View} from 'react-native'

/**
 * `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
 * reaches expo-modules-core's native bindings, which do not exist in the test
 * runtime -- so a component that renders SwiftUI is untestable without a
 * stand-in. This one covers the views the event detail uses, rendering each as
 * the React Native view closest to what it does natively.
 *
 * Deliberately narrow, matching the map feature's mock: it exports what this
 * module imports and nothing else, rather than pretending to be the whole
 * module.
 */

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

const modifier =
	($type: string) =>
	(value?: unknown): Modifier => ({$type, value})

export const font = modifier('font')
export const foregroundStyle = modifier('foregroundStyle')
export const textSelection = modifier('textSelection')
export const frame = modifier('frame')
export const clipShape = modifier('clipShape')
export const padding = modifier('padding')
export const background = modifier('background')
export const multilineTextAlignment = modifier('multilineTextAlignment')
export const buttonStyle = modifier('buttonStyle')
export const listRowBackground = modifier('listRowBackground')
export const listRowInsets = modifier('listRowInsets')
export const listRowSeparator = modifier('listRowSeparator')
export const listStyle = modifier('listStyle')
export const refreshable = modifier('refreshable')
export const scrollContentBackground = modifier('scrollContentBackground')
export const lineLimit = modifier('lineLimit')
export const truncationMode = modifier('truncationMode')
export const contentShape = modifier('contentShape')
export const offset = modifier('offset')
export const opacity = modifier('opacity')
export const scrollPosition = modifier('scrollPosition')
export const id = modifier('id')
export const scrollTargetLayout = modifier('scrollTargetLayout')

/**
 * Shape builders, not modifiers: `contentShape(shapes.rectangle())` passes one
 * in. Only the shape this module uses is here, matching the mock's habit of
 * exporting what is imported and nothing more.
 */
export const shapes = {
	rectangle: () => ({type: 'rectangle'}) as const,
}

export function useNativeState<T>(initial: T): {value: T} {
	// The real hook hands back one mutable box that outlives every render, which
	// is what a ref read straight back out gives. That read is the point here.
	let ref = React.useRef({value: initial})
	// oxlint-disable-next-line react/refs
	return ref.current
}

export function RNHostView({
	children,
}: {
	children: React.ReactNode
	matchContents?: boolean
}): React.ReactNode {
	return <View>{children}</View>
}

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

export const accessibilityIdentifier = (identifier: string): Modifier => ({
	$type: 'accessibilityIdentifier',
	identifier,
})

/**
 * The label an `accessibilityLabel(…)` modifier asks for, which is what
 * VoiceOver -- and therefore `getByLabelText` -- would report natively.
 */
function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

/**
 * The handler a `refreshable(…)` modifier carries, so a test can trigger it
 * the way a native pull-to-refresh gesture would.
 */
function refreshableOf(modifiers?: Modifier[]): (() => Promise<void>) | undefined {
	let found = modifiers?.find((m) => m.$type === 'refreshable')
	return typeof found?.value === 'function' ? (found.value as () => Promise<void>) : undefined
}

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Form({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

/**
 * A stack's modifiers are all appearance -- tint, frame, spacing -- and none of
 * that is decided here, so both stacks drop them and render as a plain view.
 */
export function VStack({children, testID}: WithModifiers & {testID?: string}): React.ReactNode {
	return <View testID={testID}>{children}</View>
}

export function HStack({
	children,
	testID,
}: WithModifiers & {spacing?: number; testID?: string}): React.ReactNode {
	return <View testID={testID}>{children}</View>
}

export function ZStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function LazyVStack({children}: WithModifiers & {alignment?: string}): React.ReactNode {
	return <View>{children}</View>
}

export function ScrollView({children, modifiers}: WithModifiers): React.ReactNode {
	let onRefresh = refreshableOf(modifiers)

	return (
		<View>
			{onRefresh ? (
				<Pressable
					accessibilityLabel="Refresh"
					onPress={() => {
						void onRefresh()
					}}
					testID="list-refresh-trigger"
				/>
			) : null}
			{children}
		</View>
	)
}

/**
 * `List` renders its `refreshable(…)` handler as a pressable trigger --
 * `testID="list-refresh-trigger"` -- since react-test-renderer has no way to
 * simulate SwiftUI's own pull-to-refresh gesture.
 */
export function List({
	children,
	modifiers,
}: WithModifiers & {selection?: (string | number)[]}): React.ReactNode {
	let onRefresh = refreshableOf(modifiers)

	return (
		<View>
			{onRefresh ? (
				<Pressable
					accessibilityLabel="Refresh"
					onPress={() => {
						void onRefresh()
					}}
					testID="list-refresh-trigger"
				/>
			) : null}
			{children}
		</View>
	)
}

/**
 * Decorative in every call site this module has -- the subtitle's location
 * pin -- so the mock renders nothing rather than a text node that would
 * confuse a query for the subtitle text next to it.
 */
export function Image(): React.ReactNode {
	return null
}

export function Spacer(): React.ReactNode {
	return null
}

export function Text({
	children,
	modifiers,
	testID,
}: WithModifiers & {testID?: string}): React.ReactNode {
	return (
		<RNText accessibilityLabel={labelOf(modifiers)} testID={testID}>
			{children}
		</RNText>
	)
}

/**
 * `title` renders as text so a test can assert a section is present.
 * `header`/`footer` are real `SwiftUIContent` slots on the native component --
 * a bare string handed to either crashes at mount -- but react-test-renderer
 * happily accepts a raw string child of `View`, so rendering them wouldn't
 * catch that. The explicit throw below is what earns the claim.
 */
export function Section({
	children,
	title,
	header,
	footer,
}: WithModifiers & {
	title?: string
	header?: React.ReactNode
	footer?: React.ReactNode
}): React.ReactNode {
	if (typeof header === 'string' || typeof footer === 'string') {
		throw new Error('Section header/footer are SwiftUI slots; a bare string crashes at mount')
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

export function Link({label, destination}: {label?: string; destination: string}): React.ReactNode {
	return <RNText accessibilityLabel={destination}>{label ?? destination}</RNText>
}

/**
 * `ButtonProps` documents that children must be nested elements, not plain
 * strings; the throw below mirrors that constraint instead of silently
 * accepting what the real component would reject.
 */
export function Button({
	children,
	label,
	onPress,
	modifiers,
}: WithModifiers & {label?: string; onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	return (
		<Pressable accessibilityLabel={labelOf(modifiers)} onPress={onPress}>
			{children ?? (label ? <RNText>{label}</RNText> : null)}
		</Pressable>
	)
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
