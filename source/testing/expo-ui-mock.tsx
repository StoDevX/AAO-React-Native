import * as React from 'react'
import {Pressable, Text as RNText, TextInput, View} from 'react-native'

/// `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
/// reaches expo-modules-core's native bindings, which do not exist in the test
/// runtime -- so a component that renders SwiftUI is untestable without a
/// stand-in. This one covers the views the map sheets use, rendering each as
/// the React Native view closest to what it does natively: taps land on
/// pressables, text lands in <Text>, and a modifier that sets an accessibility
/// label sets one here too, so queries read the same as they would on device.
///
/// Deliberately narrow: it exports what this feature imports and nothing else,
/// rather than pretending to be the whole module.

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

export const pickerStyle = (style: string): Modifier => ({
	$type: 'pickerStyle',
	style,
})

export const tag = (value: string | number): Modifier => ({
	$type: 'tag',
	tag: value,
})

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

export const font = (params: Record<string, unknown>): Modifier => ({
	$type: 'font',
	...params,
})

export const foregroundStyle = (style: unknown): Modifier => ({
	$type: 'foregroundStyle',
	style,
})

export const autocorrectionDisabled = (disabled = true): Modifier => ({
	$type: 'autocorrectionDisabled',
	disabled,
})

export const textInputAutocapitalization = (autocapitalization: string): Modifier => ({
	$type: 'textInputAutocapitalization',
	autocapitalization,
})

export const listRowInsets = (params: Record<string, number> = {}): Modifier => ({
	$type: 'listRowInsets',
	...params,
})

export const contentShape = (shape: unknown): Modifier => ({
	$type: 'contentShape',
	shape,
})

export const shapes = {
	rectangle: (): Modifier => ({$type: 'rectangle'}),
	circle: (): Modifier => ({$type: 'circle'}),
}

export const buttonStyle = (style: string): Modifier => ({
	$type: 'buttonStyle',
	style,
})

/// The label a `accessibilityLabel(…)` modifier asks for, which is what
/// VoiceOver -- and therefore `getByLabelText` -- would report natively.
function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifiers?.find((m) => m.$type === 'accessibilityLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

/// The handler a `refreshable(…)` modifier registers, read out the same way
/// `labelOf` reads an `accessibilityLabel(…)` modifier.
function refreshHandlerOf(modifiers?: Modifier[]): (() => Promise<void>) | undefined {
	let found = modifiers?.find((m) => m.$type === 'refreshable')
	return typeof found?.handler === 'function' ? (found.handler as () => Promise<void>) : undefined
}

export function Host({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Text({children, modifiers}: WithModifiers): React.ReactNode {
	return <RNText accessibilityLabel={labelOf(modifiers)}>{children}</RNText>
}

/// `View` forwards any prop it doesn't recognise straight onto the host
/// node, unlike `Pressable`, which rebuilds its own `onPress`/`onClick` and
/// does not preserve the original function or its return value. This alias
/// types that one extra prop so `List` can hand a test the raw
/// `refreshable(…)` handler -- promise and all -- with nothing in between.
const RefreshableView = View as unknown as React.ComponentType<
	WithModifiers & {testID?: string; onRefresh?: () => Promise<void>}
>

export function List({children, modifiers}: WithModifiers): React.ReactNode {
	let onRefresh = refreshHandlerOf(modifiers)
	return (
		<RefreshableView onRefresh={onRefresh} testID={onRefresh ? 'refreshable' : undefined}>
			{children}
		</RefreshableView>
	)
}

List.ForEach = function ListForEach({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Section({children, title}: WithModifiers & {title?: string}): React.ReactNode {
	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{children}
		</View>
	)
}

export function HStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function VStack({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Spacer(): React.ReactNode {
	return <View />
}

/// A menu's items are only on screen once it is opened, which a stand-in
/// cannot model. Rendering both the trigger and the items keeps the actions
/// reachable, so a test can still assert what tapping one does.
export function Menu({
	children,
	label,
	modifiers,
}: WithModifiers & {label?: React.ReactNode}): React.ReactNode {
	return (
		<View accessibilityLabel={labelOf(modifiers)}>
			{typeof label === 'string' ? <RNText>{label}</RNText> : label}
			{children}
		</View>
	)
}

export function RNHostView({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Image({
	modifiers,
	systemName,
}: WithModifiers & {systemName?: string; size?: number}): React.ReactNode {
	return <View accessibilityLabel={labelOf(modifiers) ?? systemName} />
}

export function Button({
	children,
	label,
	modifiers,
	onPress,
}: WithModifiers & {label?: string; onPress?: () => void}): React.ReactNode {
	// The real Button takes either a `label` string (a simple text button) or
	// custom `children`, never both -- mirror that so a row's text lands the
	// same way a query would find it on device.
	return (
		<Pressable accessibilityLabel={labelOf(modifiers)} onPress={onPress}>
			{label ? <RNText>{label}</RNText> : children}
		</Pressable>
	)
}

export function TextField({
	modifiers,
	onTextChange,
	placeholder,
}: WithModifiers & {
	placeholder?: string
	onTextChange?: (text: string) => void
}): React.ReactNode {
	// A SwiftUI TextField reports its placeholder as its accessibility label
	// when it has no separate one, which is how the sheet's search field is
	// found both on device and here.
	return (
		<TextInput
			accessibilityLabel={labelOf(modifiers) ?? placeholder}
			onChangeText={onTextChange}
			placeholder={placeholder}
		/>
	)
}

type PickerProps<T> = {
	selection?: T
	onSelectionChange?: (selection: T) => void
	children?: React.ReactNode
	modifiers?: Modifier[]
}

/// Reads each child's `tag(…)` modifier, which is what the native picker
/// reports back through `onSelectionChange`.
function tagOf(child: React.ReactNode): unknown {
	if (!React.isValidElement<{modifiers?: Modifier[]}>(child)) {
		return undefined
	}
	return child.props.modifiers?.find((m) => m.$type === 'tag')?.tag
}

export function Picker<T>({
	selection,
	onSelectionChange,
	children,
}: PickerProps<T>): React.ReactNode {
	return (
		<View>
			{React.Children.map(children, (child) => {
				let value = tagOf(child) as T
				return (
					<Pressable
						accessibilityState={{selected: value === selection}}
						onPress={() => onSelectionChange?.(value)}
					>
						{child}
					</Pressable>
				)
			})}
		</View>
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
export const tint = (color: unknown): Modifier => ({$type: 'tint', color})

export const listStyle = (style: string): Modifier => ({$type: 'listStyle', style})
export const lineLimit = (value: unknown): Modifier => ({$type: 'lineLimit', value})
export const lineSpacing = (value: number): Modifier => ({$type: 'lineSpacing', value})
export const italic = (): Modifier => ({$type: 'italic'})
export const bold = (): Modifier => ({$type: 'bold'})
export const textSelection = (value: boolean): Modifier => ({$type: 'textSelection', value})
export const refreshable = (handler: () => Promise<void>): Modifier => ({
	$type: 'refreshable',
	handler,
})
export const background = (color: unknown): Modifier => ({$type: 'background', color})
export const presentationDetents = (detents: unknown[], options?: unknown): Modifier => ({
	$type: 'presentationDetents',
	detents,
	options,
})
export const presentationDragIndicator = (visibility: string): Modifier => ({
	$type: 'presentationDragIndicator',
	visibility,
})
export const accessibilityIdentifier = (id: string): Modifier => ({
	$type: 'accessibilityIdentifier',
	id,
})
export const padding = (params: Record<string, number>): Modifier => ({$type: 'padding', ...params})
export const frame = (params: Record<string, unknown>): Modifier => ({$type: 'frame', ...params})
export const hidden = (isHidden = true): Modifier => ({$type: 'hidden', isHidden})
export const ignoreSafeArea = (params: Record<string, unknown> = {}): Modifier => ({
	$type: 'ignoreSafeArea',
	...params,
})

export function ScrollView({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Group({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Form({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function ProgressView(): React.ReactNode {
	return <View accessibilityLabel="Loading" />
}

/// Renders only what the title and description would say, which is all a
/// branch assertion needs -- the artwork and layout are an XCUITest's job.
export function ContentUnavailableView({
	title,
	description,
}: {
	title?: string
	systemImage?: string
	description?: string
}): React.ReactNode {
	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{description ? <RNText>{description}</RNText> : null}
		</View>
	)
}

/// A sheet is either presented or it is not; when it is, its children are in
/// the tree. That is the only part of a sheet Jest can see.
export function BottomSheet({
	children,
	isPresented,
}: WithModifiers & {
	isPresented?: boolean
	onIsPresentedChange?: (presented: boolean) => void
}): React.ReactNode {
	return isPresented ? <View>{children}</View> : null
}

/// Mirrors the shape of the real `ObservableState<T>`: `value` is the
/// property, `get()`/`set()` are the React-Compiler-safe accessors. The
/// stand-in `TextField` ignores it and works off `onTextChange`, so this only
/// needs to satisfy the call sites.
export function useNativeState<T>(initial: T): {
	value: T
	get: () => T
	set: (value: T) => void
	onChange: null
} {
	let [value, setValue] = React.useState(initial)
	return {value, get: () => value, set: setValue, onChange: null}
}
