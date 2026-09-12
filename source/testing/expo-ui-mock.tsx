import * as React from 'react'
import {Pressable, Text as RNText, TextInput, View} from 'react-native'

/**
 * `@expo/ui/swift-ui` cannot be loaded under Jest at all -- importing it
 * reaches expo-modules-core's native bindings, which do not exist in the test
 * runtime -- so a component that renders SwiftUI is untestable without a
 * stand-in. This is that stand-in, for the whole app: every suite that renders
 * SwiftUI points both `@expo/ui/swift-ui` and `@expo/ui/swift-ui/modifiers`
 * here.
 *
 * Each view renders as the React Native view closest to what it does natively:
 * taps land on pressables, text lands in `<Text>`, and a modifier that sets an
 * accessibility label sets one here too, so a query reads the same as it would
 * on device.
 *
 * Where the real component rejects something -- a bare string in a slot, a
 * `Text` child that is neither text nor another `Text` -- this one rejects it
 * too. A stand-in more permissive than the thing it stands for turns a broken
 * screen into a passing test, which is the failure this file exists to avoid.
 */

type Modifier = {$type: string; [key: string]: unknown}
type WithModifiers = {modifiers?: Modifier[]; children?: React.ReactNode}

/**
 * Mirrors `@expo/ui`'s own `createModifier`: a `$type` tag and the parameters
 * verbatim. Every factory below goes through it with the real modifier's own
 * parameter names, so a payload read back here carries the keys it would
 * natively -- a stand-in that renamed them could agree with itself while
 * disagreeing with the device.
 */
function createModifier(type: string, params: Record<string, unknown> = {}): Modifier {
	return {$type: type, ...params}
}

/** A modifier whose argument is a parameter object, spread into the payload. */
function spreading(type: string) {
	return (params: Record<string, unknown> = {}): Modifier => createModifier(type, params)
}

/** A modifier whose single argument lands under one named key. */
function named(type: string, key: string) {
	return (value?: unknown): Modifier => createModifier(type, {[key]: value})
}

/** A modifier that carries nothing beyond its own presence. */
function bare(type: string) {
	return (): Modifier => createModifier(type)
}

/** A modifier whose flag defaults to on, the way the real one's does. */
function flag(type: string, key: string) {
	return (value = true): Modifier => createModifier(type, {[key]: value})
}

export const accessibilityAddTraits = named('accessibilityAddTraits', 'traits')
export const accessibilityIdentifier = named('accessibilityIdentifier', 'identifier')
export const accessibilityLabel = named('accessibilityLabel', 'label')
export const aspectRatio = spreading('aspectRatio')
export const autocorrectionDisabled = flag('autocorrectionDisabled', 'disabled')
export const bold = bare('bold')
export const buttonStyle = named('buttonStyle', 'style')
export const disabled = flag('disabled', 'disabled')
export const font = spreading('font')
export const foregroundStyle = named('foregroundStyle', 'style')
export const frame = spreading('frame')
export const hidden = flag('hidden', 'hidden')
export const id = named('id', 'id')
export const ignoreSafeArea = spreading('ignoreSafeArea')
export const italic = bare('italic')
export const kerning = named('kerning', 'value')
export const lineSpacing = named('lineSpacing', 'value')
export const listRowBackground = named('listRowBackground', 'color')
export const listRowInsets = spreading('listRowInsets')
export const listStyle = named('listStyle', 'style')
export const menuActionDismissBehavior = named('menuActionDismissBehavior', 'behavior')
export const menuIndicator = named('menuIndicator', 'visibility')
export const minimumScaleFactor = named('minimumScaleFactor', 'factor')
export const monospacedDigit = bare('monospacedDigit')
export const multilineTextAlignment = named('multilineTextAlignment', 'alignment')
export const offset = spreading('offset')
export const opacity = named('opacity', 'value')
export const padding = spreading('padding')
export const pickerStyle = named('pickerStyle', 'style')
export const presentationBackground = named('presentationBackground', 'color')
export const presentationDragIndicator = named('presentationDragIndicator', 'visibility')
export const scrollContentBackground = named('scrollContentBackground', 'visible')
export const scrollTargetLayout = bare('scrollTargetLayout')
export const strikethrough = spreading('strikethrough')
export const submitLabel = named('submitLabel', 'submitLabel')
export const tabViewStyle = spreading('tabViewStyle')
export const tag = named('tag', 'tag')
export const textInputAutocapitalization = named(
	'textInputAutocapitalization',
	'autocapitalization',
)
export const layoutPriority = named('layoutPriority', 'priority')
export const textSelection = named('textSelection', 'value')
export const tint = named('tint', 'color')
export const truncationMode = named('truncationMode', 'mode')
export const underline = spreading('underline')
export const fixedSize = spreading('fixedSize')

export const background = (color: unknown, shape?: Record<string, unknown>): Modifier =>
	createModifier('background', {color, ...shape})

export const clipShape = (shape: string, cornerRadius?: number): Modifier =>
	createModifier('clipShape', {shape, cornerRadius})

export const contentShape = (shape: Record<string, unknown>, kind?: string | string[]): Modifier =>
	createModifier('contentShape', {
		...shape,
		kind: kind === undefined ? undefined : [kind].flat(),
	})

/** Takes either a config object or a key and a value, as the real one does. */
export function environment(
	configOrKey: Record<string, unknown> | string,
	value?: string,
): Modifier {
	if (typeof configOrKey === 'string') {
		return createModifier('environment', {key: configOrKey, value})
	}
	return createModifier('environment', configOrKey)
}

/** A count, a `{min, max}` range, or nothing at all -- all three are real. */
export function lineLimit(
	limitOrRange?: number | {min: number; max: number},
	options?: {reservesSpace?: boolean},
): Modifier {
	if (typeof limitOrRange === 'object' && limitOrRange !== null) {
		return createModifier('lineLimit', {min: limitOrRange.min, max: limitOrRange.max})
	}
	return createModifier('lineLimit', {
		limit: limitOrRange,
		reservesSpace: options?.reservesSpace,
	})
}

export const listRowSeparator = (visibility: string, edges?: string): Modifier =>
	createModifier('listRowSeparator', {visibility, edges})

export const presentationDetents = (
	detents: unknown[],
	options?: {selection?: unknown},
): Modifier => createModifier('presentationDetents', {detents, selection: options?.selection})

/**
 * The real modifier hands native a wrapped handler that tells SwiftUI the
 * refresh has finished; this one carries the caller's own handler under
 * `handler`, since the promise a test awaits is the caller's, and there is no
 * native side here to report back to. `List` and `ScrollView` read it.
 */
export const refreshable = (handler: () => Promise<void>): Modifier =>
	createModifier('refreshable', {handler})

export const resizable = (capInsets?: Record<string, number>, resizingMode?: string): Modifier =>
	createModifier('resizable', {...capInsets, resizingMode})

/**
 * Natively this carries the state's native id; there is no native state to
 * take an id from here, so it carries the handle itself. Nothing reads it --
 * where a scroll lands is a UI test's question.
 */
export const scrollPosition = (
	state: unknown,
	options?: {anchor?: string; onChange?: (id: string | null) => void},
): Modifier =>
	createModifier('scrollPosition', {
		id: state,
		anchor: options?.anchor,
		onChange: options?.onChange,
	})

/**
 * Shape builders, not modifiers: `contentShape(shapes.rectangle())` passes one
 * in. Only the shapes this app builds with are here.
 */
export const shapes = {
	rectangle: (): Record<string, unknown> => ({shape: 'rectangle'}),
	circle: (): Record<string, unknown> => ({shape: 'circle'}),
	roundedRectangle: (params: {
		cornerRadius?: number
		roundedCornerStyle?: string
		cornerSize?: {width: number; height: number}
	}): Record<string, unknown> => ({
		cornerRadius: params.cornerRadius,
		roundedCornerStyle: params.roundedCornerStyle,
		cornerSize: params.cornerSize,
		shape: 'roundedRectangle',
	}),
}

/** Reads the one modifier of a given type off a list, if it is there. */
function modifierOf(modifiers: Modifier[] | undefined, type: string): Modifier | undefined {
	return modifiers?.find((modifier) => modifier.$type === type)
}

/**
 * The label an `accessibilityLabel(…)` modifier asks for, which is what
 * VoiceOver -- and therefore `getByLabelText` -- would report natively.
 */
function labelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifierOf(modifiers, 'accessibilityLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

/** The identifier an `accessibilityIdentifier(…)` modifier asks for. */
function identifierOf(modifiers?: Modifier[]): string | undefined {
	let found = modifierOf(modifiers, 'accessibilityIdentifier')
	return typeof found?.identifier === 'string' ? found.identifier : undefined
}

/** Whether a `disabled(…)` modifier asked for the control to be off. */
function isDisabled(modifiers?: Modifier[]): boolean {
	return modifierOf(modifiers, 'disabled')?.disabled === true
}

/** The value a `tag(…)` modifier carries, which is what a selection reports. */
function tagOf(modifiers?: Modifier[]): string | number | undefined {
	let found = modifierOf(modifiers, 'tag')?.tag
	return typeof found === 'string' || typeof found === 'number' ? found : undefined
}

/** The letter a `sectionIndexLabel(…)` modifier asks the jumplist rail to show. */
function sectionIndexLabelOf(modifiers?: Modifier[]): string | undefined {
	let found = modifierOf(modifiers, 'sectionIndexLabel')
	return typeof found?.label === 'string' ? found.label : undefined
}

/** The handler a `refreshable(…)` modifier registers. */
function refreshHandlerOf(modifiers?: Modifier[]): (() => Promise<void>) | undefined {
	let found = modifierOf(modifiers, 'refreshable')
	return typeof found?.handler === 'function' ? (found.handler as () => Promise<void>) : undefined
}

/**
 * The text a control announces when its label is a view rather than a string.
 *
 * SwiftUI derives a control's accessible name from the text inside its label,
 * so a trigger drawing a title beside a chevron still announces just the title
 * -- an `Image` contributes nothing. A label view's `title` prop is the text it
 * draws, so reading the prop models the same outcome without rendering to find
 * out.
 */
function textOf(label: React.ReactNode): string | undefined {
	if (typeof label === 'string') {
		return label
	}
	if (React.isValidElement(label)) {
		let props = label.props as {title?: unknown}
		return typeof props.title === 'string' ? props.title : undefined
	}
	return undefined
}

/**
 * `View` forwards any prop it doesn't recognise straight onto the host node,
 * so a test can read a handler back off a `testID` and call it directly --
 * promise, arguments and all. These casts only tell TypeScript that.
 */
const ForwardingView = View as unknown as React.ComponentType<
	WithModifiers & {
		accessibilityLabel?: string
		testID?: string
		onRefresh?: () => Promise<void>
		onDelete?: unknown
		onMove?: unknown
	}
>

/**
 * `Pressable` spreads whatever it doesn't recognise onto its own host view
 * too, so a control can carry its `modifiers` for a test to compare two
 * triggers by, while still honouring `disabled` the way a real control does.
 */
const PressableWithModifiers = Pressable as unknown as React.ComponentType<
	WithModifiers & {
		accessibilityLabel?: string
		accessibilityRole?: string
		accessibilityState?: {checked?: boolean; selected?: boolean}
		accessible?: boolean
		disabled?: boolean
		onPress?: () => void
		testID?: string
	}
>

export function Host({children}: WithModifiers & {matchContents?: boolean}): React.ReactNode {
	return <View>{children}</View>
}

export function RNHostView({children}: WithModifiers & {matchContents?: boolean}): React.ReactNode {
	return <View>{children}</View>
}

/**
 * Mirrors the real `Text`'s children filter: SwiftUI's `Text` concatenation
 * only accepts a string/number or a nested `Text` element, and silently drops
 * anything else -- a custom component, a `Fragment` -- with no warning on
 * device. Filtering here the same way turns that into a Jest failure instead
 * of a blank sentence discovered on a phone.
 */
export function Text({
	children,
	modifiers,
	testID,
}: WithModifiers & {testID?: string}): React.ReactNode {
	let kept = React.Children.toArray(children).filter(
		(child) =>
			typeof child === 'string' ||
			typeof child === 'number' ||
			(React.isValidElement(child) && child.type === Text),
	)
	return (
		<RNText accessibilityLabel={labelOf(modifiers)} testID={testID}>
			{kept}
		</RNText>
	)
}

/**
 * `title` renders as text so a test can assert a section is present. `header`
 * and `footer` are real `SwiftUIContent` slots on the native component -- a
 * bare string handed to either crashes at mount -- but react-test-renderer
 * happily accepts a raw string child of `View`, so rendering them wouldn't
 * catch that. The explicit throw is what earns the claim.
 */
export function Section({
	children,
	footer,
	header,
	modifiers,
	title,
}: WithModifiers & {
	title?: string
	header?: React.ReactNode
	footer?: React.ReactNode
}): React.ReactNode {
	if (typeof header === 'string' || typeof footer === 'string') {
		throw new Error('Section header/footer are SwiftUI slots; a bare string crashes at mount')
	}

	let indexLabel = sectionIndexLabelOf(modifiers)

	return (
		<View>
			{title ? <RNText>{title}</RNText> : null}
			{indexLabel ? <RNText accessibilityLabel={`section index ${indexLabel}`} /> : null}
			{header}
			{children}
			{footer}
		</View>
	)
}

/**
 * A `List` given a `selection` owns its rows' taps -- that is what draws the
 * circular checkboxes, and why such a row is plain content carrying a `tag`
 * rather than a `Button`. This context models that ownership: a tagged
 * `HStack` inside such a list becomes the pressable thing, and pressing it
 * reports the whole new selection, as SwiftUI does.
 */
const ListSelection = React.createContext<{
	selection: (string | number)[]
	onSelectionChange: (selection: (string | number)[]) => void
} | null>(null)

/**
 * A `refreshable(…)` handler is handed to the test verbatim, as `onRefresh` on
 * `testID="refreshable"`: there is no pull gesture to simulate here, and the
 * point of the handler is the promise it returns, which `Pressable` would not
 * preserve.
 */
function Refreshable({children, modifiers}: WithModifiers): React.ReactNode {
	let onRefresh = refreshHandlerOf(modifiers)
	return (
		<ForwardingView onRefresh={onRefresh} testID={onRefresh ? 'refreshable' : undefined}>
			{children}
		</ForwardingView>
	)
}

export function List({
	children,
	modifiers,
	onSelectionChange,
	selection,
}: WithModifiers & {
	selection?: (string | number)[]
	onSelectionChange?: (selection: (string | number)[]) => void
}): React.ReactNode {
	let rows = <Refreshable modifiers={modifiers}>{children}</Refreshable>

	if (!selection || !onSelectionChange) {
		return rows
	}

	return (
		<ListSelection.Provider value={{selection, onSelectionChange}}>{rows}</ListSelection.Provider>
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
	// A test reads the handlers back off `testID="for-each"` and calls them
	// directly. There is no drag gesture to simulate here; the drag itself is a
	// UI test.
	return (
		<ForwardingView onDelete={onDelete} onMove={onMove} testID="for-each">
			{children}
		</ForwardingView>
	)
}

export function ScrollView({children, modifiers}: WithModifiers): React.ReactNode {
	return <Refreshable modifiers={modifiers}>{children}</Refreshable>
}

export function Form({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

export function Group({children}: WithModifiers): React.ReactNode {
	return <View>{children}</View>
}

/**
 * A row inside a selecting `List` is the pressable thing, so an `HStack`
 * carrying a `tag(…)` inside one reports the new selection when pressed.
 * Everywhere else a stack is layout, which Jest cannot see, so it renders as a
 * plain view.
 */
export function HStack({
	children,
	modifiers,
	testID,
}: WithModifiers & {
	alignment?: string
	spacing?: number
	testID?: string
}): React.ReactNode {
	let list = React.useContext(ListSelection)
	let rowTag = tagOf(modifiers)

	if (!list || rowTag === undefined) {
		return <View testID={testID}>{children}</View>
	}

	let isSelected = list.selection.includes(rowTag)

	return (
		<PressableWithModifiers
			accessibilityRole="button"
			accessibilityState={{selected: isSelected}}
			accessible={true}
			onPress={() =>
				list.onSelectionChange(
					isSelected
						? list.selection.filter((value) => value !== rowTag)
						: [...list.selection, rowTag],
				)
			}
			testID={identifierOf(modifiers) ?? testID}
		>
			{children}
		</PressableWithModifiers>
	)
}

export function VStack({
	children,
	testID,
}: WithModifiers & {alignment?: string; spacing?: number; testID?: string}): React.ReactNode {
	return <View testID={testID}>{children}</View>
}

export function ZStack({children}: WithModifiers & {alignment?: string}): React.ReactNode {
	return <View>{children}</View>
}

export function LazyVStack({children}: WithModifiers & {alignment?: string}): React.ReactNode {
	return <View>{children}</View>
}

/**
 * A paged `TabView` renders one tab at a time natively. The stand-in renders
 * the selected tab's children and drops the rest, which is the decision a test
 * can legitimately assert -- which day's events are on screen. Whether the
 * pager swipes is a gesture, and belongs to a UI test.
 */
export function TabView({
	children,
	defaultSelection,
	selection,
}: {
	selection?: string
	defaultSelection?: string
	onSelectionChange?: (value: string) => void
	children?: React.ReactNode
}): React.ReactNode {
	let tabs = React.Children.toArray(children) as React.ReactElement<{
		value: string
		children?: React.ReactNode
	}>[]
	// Uncontrolled is how the day view drives this: it hands over a
	// `defaultSelection` and rebuilds the pager to move it.
	//
	// A selection matching no tab renders nothing, which is what the native
	// component does -- it seeds its own state with whatever it was handed and
	// SwiftUI draws no page for a value no tab carries. Falling back to the
	// first tab here would turn a blank screen on a device into a passing test.
	let chosen = selection ?? defaultSelection
	let active = tabs.find((tab) => tab.props.value === chosen)
	return <View>{active ?? null}</View>
}

TabView.Tab = function Tab({
	children,
}: {
	value: string
	children?: React.ReactNode
}): React.ReactNode {
	return <View>{children}</View>
}

/** A spacer takes up room and says nothing, so there is nothing to render. */
export function Spacer(): React.ReactNode {
	return null
}

/**
 * A `Divider` draws a rule and carries nothing -- no label, no children, no
 * behaviour. The stand-in is an empty view: it exists so a tree containing one
 * mounts, not to be asserted on. What a rule looks like is a screenshot's
 * business.
 */
export function Divider({modifiers}: {modifiers?: Modifier[]}): React.ReactNode {
	return <ForwardingView modifiers={modifiers} />
}

/**
 * A menu's items are only on screen once it is opened, which a stand-in cannot
 * model. Rendering both the trigger and the items keeps the actions reachable,
 * so a test can still assert what tapping one does. `testID` is keyed by the
 * trigger text so a toolbar drawing several menus at once still gives each one
 * back unambiguously.
 *
 * `label` may legitimately be a string -- `MenuProps.label` is documented as
 * `string | ReactNode`, and a string there is the trigger text, not a slot
 * bug. `children` may not: the real component only accepts nested elements,
 * and a raw string there crashes at mount the same way `Button`'s children do.
 */
export function Menu({
	children,
	label,
	modifiers,
}: WithModifiers & {label?: React.ReactNode}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Menu children must be nested elements, not a plain string')
	}

	let name = labelOf(modifiers) ?? textOf(label)

	return (
		<ForwardingView
			accessibilityLabel={name}
			modifiers={modifiers}
			testID={name ? `menu:${name}` : undefined}
		>
			{typeof label === 'string' ? <RNText>{label}</RNText> : label}
			{children}
		</ForwardingView>
	)
}

/**
 * A `Toggle` inside a `Menu` is how this codebase draws a checked menu item --
 * the platform supplies the checkmark, so the stand-in only reports the label
 * and forwards the flipped state rather than painting a check glyph of its
 * own.
 */
export function Toggle({
	children,
	isOn,
	label,
	onIsOnChange,
}: WithModifiers & {
	label?: React.ReactNode
	isOn?: boolean
	onIsOnChange?: (isOn: boolean) => void
}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Toggle children must be nested elements, not a plain string')
	}

	return (
		<PressableWithModifiers
			accessibilityRole="menuitem"
			accessibilityState={{checked: isOn}}
			onPress={() => onIsOnChange?.(!isOn)}
		>
			{children ?? (typeof label === 'string' ? <RNText>{label}</RNText> : label)}
		</PressableWithModifiers>
	)
}

/**
 * `ButtonProps` documents that children must be nested elements, not plain
 * strings; the throw mirrors that constraint instead of silently accepting
 * what the real component would reject.
 *
 * The accessible name is what `getByRole('button', {name})` and
 * `getByLabelText` find, and it comes from the same places the real button
 * takes it from: an `accessibilityLabel(…)` modifier overrides everything --
 * that is how a row announces the dietary tags its text does not mention --
 * and otherwise the `label` prop, or the text inside a custom label view. An
 * icon-only button has neither, so it falls back to its
 * `accessibilityIdentifier(…)` for a `testID` to be found by at all.
 */
export function Button({
	children,
	label,
	modifiers,
	onPress,
}: WithModifiers & {label?: React.ReactNode; onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	let name = labelOf(modifiers) ?? textOf(label) ?? textOf(children)
	let identifier = identifierOf(modifiers)

	return (
		<PressableWithModifiers
			accessibilityLabel={name}
			accessibilityRole="button"
			// `RNTL`'s `getByRole` only considers an element an accessibility
			// element -- and so a candidate at all -- once `accessible` is
			// explicitly set.
			accessible={true}
			disabled={isDisabled(modifiers)}
			modifiers={modifiers}
			onPress={onPress}
			testID={name ? `button:${name}` : identifier ? `button:${identifier}` : undefined}
		>
			{children ?? (typeof label === 'string' ? <RNText>{label}</RNText> : label)}
		</PressableWithModifiers>
	)
}

export function Link({label, destination}: {label?: string; destination: string}): React.ReactNode {
	return <RNText accessibilityLabel={destination}>{label ?? destination}</RNText>
}

/**
 * An image announces the name it was given -- an `accessibilityLabel(…)`
 * modifier first, then the SF Symbol it draws -- and carries a `testID` saying
 * which of the two sources the icon came from, which is the whole contract of
 * a function that picks between an SF Symbol and a bundled file.
 */
export function Image({
	modifiers,
	systemName,
	uiImage,
}: WithModifiers & {
	systemName?: string
	uiImage?: string
	size?: number
}): React.ReactNode {
	return (
		<View
			accessibilityLabel={labelOf(modifiers) ?? systemName}
			testID={uiImage ? `icon-${uiImage}` : systemName ? `symbol-${systemName}` : undefined}
		/>
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
	// when it has no separate one, which is how a search field is found both on
	// device and here.
	//
	// `text` is a `useNativeState` handle, never a plain string -- the real
	// field's `text` prop is typed `ObservableState<string>`, a class from
	// expo-modules-core, and a string is not assignable to it.
	return (
		<TextInput
			accessibilityLabel={labelOf(modifiers) ?? placeholder}
			onChangeText={onTextChange}
			placeholder={placeholder}
			value={text?.value}
		/>
	)
}

/**
 * A label beside its value. The real one is SwiftUI's own `LabeledContent`,
 * which draws the label leading and the content trailing.
 */
export function LabeledContent({
	children,
	label,
}: WithModifiers & {label?: React.ReactNode}): React.ReactNode {
	return (
		<View>
			{typeof label === 'string' ? <RNText>{label}</RNText> : label}
			{children}
		</View>
	)
}

export function Picker<T>({
	children,
	onSelectionChange,
	selection,
}: WithModifiers & {
	selection?: T
	onSelectionChange?: (selection: T) => void
}): React.ReactNode {
	return (
		<View>
			{React.Children.map(children, (child) => {
				// A picker reports the `tag(…)` its chosen option carries.
				let value = (
					React.isValidElement<{modifiers?: Modifier[]}>(child)
						? tagOf(child.props.modifiers)
						: undefined
				) as T
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

export function ProgressView(): React.ReactNode {
	return <View accessibilityLabel="Loading" />
}

/**
 * Renders only what the title and description would say, which is all a branch
 * assertion needs -- the artwork and layout are an XCUITest's job.
 */
export function ContentUnavailableView({
	description,
	title,
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

/**
 * `anchor` stays mounted regardless of `isPresented` -- it is the trigger,
 * drawn in place -- and `children` mount only while presented, which is the
 * only part of a sheet Jest can see. The dismiss trigger stands in for the
 * gesture and the close chrome a stand-in cannot draw, and fires
 * `onIsPresentedChange` and `onDismiss` together, since both are real props a
 * caller may wire.
 */
export function BottomSheet({
	anchor,
	children,
	isPresented,
	onDismiss,
	onIsPresentedChange,
}: WithModifiers & {
	anchor?: React.ReactNode
	isPresented?: boolean
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
					/>
					{children}
				</View>
			) : null}
		</View>
	)
}

type NativeStateHandle<T> = {
	value: T
	get: () => T
	set: (value: T) => void
	onChange: null
}

/**
 * Mirrors the shape of the real `ObservableState<T>`: `value` is the property,
 * `get()`/`set()` are the React-Compiler-safe accessors. The stand-in
 * `TextField` reads `.value` on every render, where the real field captures
 * its handle's value once on mount; the two agree only because `set()` is the
 * sole thing that ever changes what the handle holds. It otherwise works off
 * `onTextChange`, so this only needs to satisfy the call sites' shape, not
 * reproduce the real `SharedObject` underneath it.
 *
 * One handle per component, kept across renders rather than rebuilt on each
 * one: the real hook returns a shared object held for the component's whole
 * life, and a caller may depend on that identity -- a field memoising its
 * focus effect on the handle would run that effect every render if a fresh
 * object arrived each time.
 */
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

/**
 * The swipe actions themselves are drawn by SwiftUI only once a row has been
 * swiped, so they are not on screen at rest. This stand-in renders nothing for
 * them: a test that could query a favourite button here would be asserting
 * something no reader can see or reach without the gesture, which neither this
 * file nor Jest can perform. Swipe behaviour belongs in an XCUITest.
 */
export function SwipeActionsGroup(_props: {
	edge?: 'leading' | 'trailing'
	allowsFullSwipe?: boolean
	children: React.ReactNode
}): React.ReactNode {
	return null
}

/** The row's ordinary content; its `Actions` are revealed only by a gesture. */
function SwipeActionsComponent({children, modifiers}: WithModifiers): React.ReactNode {
	return <ForwardingView modifiers={modifiers}>{children}</ForwardingView>
}

SwipeActionsComponent.Actions = SwipeActionsGroup

export const SwipeActions = SwipeActionsComponent
