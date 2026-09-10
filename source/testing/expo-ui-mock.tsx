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

/// Mirrors the real `Text`'s children filter: SwiftUI's `Text` concatenation
/// only accepts a string/number or a nested `Text` element, and silently
/// drops anything else -- a custom component, a `Fragment` -- with no warning
/// on device. Filtering here the same way turns that into a Jest failure
/// instead of a blank sentence discovered on a phone.
export function Text({children, modifiers}: WithModifiers): React.ReactNode {
	let kept = React.Children.toArray(children).filter(
		(child) =>
			typeof child === 'string' ||
			typeof child === 'number' ||
			(React.isValidElement(child) && child.type === Text),
	)
	return <RNText accessibilityLabel={labelOf(modifiers)}>{kept}</RNText>
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

List.ForEach = function ListForEach({
	children,
	onDelete,
	onMove,
}: WithModifiers & {
	onDelete?: (indices: number[]) => void
	onMove?: (sourceIndices: number[], destination: number) => void
}): React.ReactNode {
	// `View` forwards unrecognised props onto the host node, so a test can read
	// the handlers back off `testID="for-each"` and call them directly. There
	// is no drag gesture to simulate here; the drag itself is a UI test.
	let Forwarding = View as unknown as React.ComponentType<
		WithModifiers & {testID?: string; onDelete?: unknown; onMove?: unknown}
	>
	return (
		<Forwarding onDelete={onDelete} onMove={onMove} testID="for-each">
			{children}
		</Forwarding>
	)
}

export function Section({
	children,
	footer,
	title,
}: WithModifiers & {title?: string; footer?: React.ReactNode}): React.ReactNode {
	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{children}
			{footer}
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
	text,
}: WithModifiers & {
	placeholder?: string
	text?: {value: string}
	onTextChange?: (text: string) => void
}): React.ReactNode {
	// A SwiftUI TextField reports its placeholder as its accessibility label
	// when it has no separate one, which is how the sheet's search field is
	// found both on device and here.
	//
	// `text` is a `useNativeState` handle, never a plain string -- the real
	// field's `text` prop is typed `ObservableState<string>`, a class from
	// expo-modules-core, and a string is not assignable to it.
	let value = text?.value
	return (
		<TextInput
			accessibilityLabel={labelOf(modifiers) ?? placeholder}
			onChangeText={onTextChange}
			placeholder={placeholder}
			value={value}
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
export const presentationBackground = (color: string): Modifier => ({
	$type: 'presentationBackground',
	color,
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
export const strikethrough = (params: Record<string, unknown>): Modifier => ({
	$type: 'strikethrough',
	...params,
})
export const underline = (params: Record<string, unknown>): Modifier => ({
	$type: 'underline',
	...params,
})
export const environment = (params: Record<string, unknown>): Modifier => ({
	$type: 'environment',
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

type NativeStateHandle<T> = {
	value: T
	get: () => T
	set: (value: T) => void
	onChange: null
}

/// Mirrors the shape of the real `ObservableState<T>`: `value` is the
/// property, `get()`/`set()` are the React-Compiler-safe accessors. The
/// stand-in `TextField` reads `.value` on every render, where the real field
/// captures its handle's value once on mount; the two agree only because
/// `set()` is the sole thing that ever changes what the handle holds. It
/// otherwise works off `onTextChange`, so this only needs to satisfy the call
/// sites' shape, not reproduce the real `SharedObject` underneath it.
///
/// One handle per component, kept across renders rather than rebuilt on each
/// one: the real hook returns a shared object held for the component's whole
/// life, and a caller may depend on that identity -- `SenseDefinitionField`
/// memoises its focus effect on it, and a fresh object every render would run
/// that effect every render instead.
export function useNativeState<T>(initial: T): NativeStateHandle<T> {
	let [, rerender] = React.useReducer((count: number) => count + 1, 0)
	let [handle] = React.useState<NativeStateHandle<T>>(() => {
		// The value lives in this closure rather than in React state, so a
		// `set()` here is readable immediately. The real handle promises that
		// only for a write from a UI worklet; a write from the JS thread is
		// scheduled onto the UI thread and is not readable until it lands.
		// Reproducing that lag would mean an async boundary Jest has no way to
		// wait on, so this stand-in resolves it synchronously -- a test that
		// turns on the timing of a JS-thread write is asking a question this
		// mock cannot answer, and belongs in a UI test.
		//
		// `set()` also re-renders, which the real one does not: native state
		// drives the SwiftUI view directly, whereas the stand-in `TextField` is
		// an ordinary React component and only reads `.value` when React draws
		// it again.
		let current = initial
		return {
			get value(): T {
				return current
			},
			get: () => current,
			set: (next: T) => {
				current = next
				rerender()
			},
			onChange: null,
		}
	})
	return handle
}
