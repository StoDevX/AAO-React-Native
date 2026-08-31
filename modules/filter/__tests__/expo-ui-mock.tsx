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

/**
 * `View` has no real `modifiers`, `onPress`, or `accessibilityRole` props --
 * this cast lets `Menu` and `Button` stash them on it anyway, purely so a
 * test can read `.props.modifiers` straight off the host node, or press it
 * via `fireEvent.press`. `react-test-renderer` records whatever props a host
 * element is given, real RN prop or not; nothing here reaches a native
 * bridge that would reject it.
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

export const buttonStyle = (style: string): Modifier => ({$type: 'buttonStyle', style})

export const accessibilityAddTraits = (traits: string[]): Modifier => ({
	$type: 'accessibilityAddTraits',
	traits,
})

export const accessibilityIdentifier = (identifier: string): Modifier => ({
	$type: 'accessibilityIdentifier',
	identifier,
})

export const accessibilityLabel = (label: string): Modifier => ({
	$type: 'accessibilityLabel',
	label,
})

export const contentShape = (shape: unknown): Modifier => ({$type: 'contentShape', shape})

export const shapes = {rectangle: (): Modifier => ({$type: 'rectangle'})}

export const resizable = (): Modifier => ({$type: 'resizable'})

export const frame = (params: Record<string, unknown> = {}): Modifier => ({
	$type: 'frame',
	...params,
})

export const font = (params: Record<string, unknown> = {}): Modifier => ({
	$type: 'font',
	...params,
})

export const foregroundStyle = (style: unknown): Modifier => ({$type: 'foregroundStyle', style})

export const padding = (params: Record<string, unknown> = {}): Modifier => ({
	$type: 'padding',
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
 *
 * `modifiers` is forwarded verbatim onto the wrapping `View`, unexamined --
 * the mock makes no decision of its own about them, so a test reading
 * `.props.modifiers` off the element found by `testID` is reading exactly
 * what `filter-menu.tsx` decided, not a translation this stand-in invented.
 * `testID` is keyed by the label text (when it's a string) so a toolbar
 * rendering several menus at once still gives each trigger back
 * unambiguously.
 */
/**
 * The text a control announces when its label is a view rather than a string.
 *
 * SwiftUI derives a control's accessible name from the text inside its label,
 * so a trigger drawing a title beside a chevron still announces just the title
 * -- an `Image` contributes nothing. `TriggerLabel` is that view, and its
 * `title` prop is the text it draws, so reading the prop models the same
 * outcome without rendering to find out.
 */
function textOf(label: string | React.ReactNode): string | undefined {
	if (typeof label === 'string') {
		return label
	}
	if (React.isValidElement(label)) {
		let props = label.props as {title?: unknown}
		return typeof props.title === 'string' ? props.title : undefined
	}
	return undefined
}

export function Menu({
	label,
	modifiers,
	children,
}: WithModifiers & {label: string | React.ReactNode}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Menu children must be nested elements, not a plain string')
	}

	let name = textOf(label)

	return (
		<ViewWithModifiers
			accessibilityLabel={name}
			modifiers={modifiers}
			testID={name ? `menu:${name}` : undefined}
		>
			{typeof label === 'string' ? <RNText>{label}</RNText> : label}
			{children}
		</ViewWithModifiers>
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
			{children ?? (typeof label === 'string' ? <RNText>{label}</RNText> : label)}
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

/**
 * A `List` given a `selection` owns its rows' taps -- that is what draws the
 * circular checkboxes, and why a row is plain content carrying a `tag` rather
 * than a `Button`. The context below models that ownership: a tagged `HStack`
 * inside such a list becomes the pressable thing, and pressing it reports the
 * whole new selection, as SwiftUI does.
 */
const ListSelection = React.createContext<{
	selection: (string | number)[]
	onSelectionChange: (selection: (string | number)[]) => void
} | null>(null)

export function List({
	children,
	selection,
	onSelectionChange,
}: WithModifiers & {
	selection?: (string | number)[]
	onSelectionChange?: (selection: (string | number)[]) => void
}): React.ReactNode {
	if (!selection || !onSelectionChange) {
		return <View>{children}</View>
	}

	return (
		<ListSelection.Provider value={{selection, onSelectionChange}}>
			<View>{children}</View>
		</ListSelection.Provider>
	)
}

List.ForEach = function ListForEach({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

/**
 * `title` renders as text so a test can assert a section is present. `header`/
 * `footer` are real `SwiftUIContent` slots on the native component -- a bare
 * string handed to either crashes at mount -- but react-test-renderer happily
 * accepts a raw string child of `View`, so rendering them wouldn't catch that.
 * The explicit throw below is what earns the claim (ported from the
 * event-list mock, this one's stated model).
 */
export function Section({
	children,
	title,
	header,
	footer,
}: WithChildren & {
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

export function HStack({children, modifiers}: WithModifiers & {spacing?: number}): React.ReactNode {
	let list = React.useContext(ListSelection)
	let rowTag = modifiers?.find((m) => m.$type === 'tag')?.value as string | number | undefined

	if (!list || rowTag === undefined) {
		return <View>{children}</View>
	}

	let isSelected = list.selection.includes(rowTag)
	let identifier = modifiers?.find((m) => m.$type === 'accessibilityIdentifier')?.identifier

	return (
		<Pressable
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
			testID={identifier as string | undefined}
		>
			{children}
		</Pressable>
	)
}

export function VStack({
	children,
}: WithChildren & {alignment?: string; spacing?: number}): React.ReactNode {
	return <View>{children}</View>
}

export function ZStack({children}: WithChildren & {alignment?: string}): React.ReactNode {
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
 * this one is modelled on). `label` is `filter-sheet.tsx`'s anchor trigger's
 * own text -- the same contract `Menu.label` has -- so it gets the same
 * treatment: reported as the accessible name (`getByRole('button', {name})`
 * finds it, the way `getByRole` already finds a real `Touchable`'s
 * `accessibilityLabel`), and `modifiers` stashed on the same host node,
 * unexamined, so a test can compare a sheet's anchor against `FilterMenu`'s
 * trigger by identity, the same way `Menu`'s testID does for menus.
 *
 * An icon-only button -- the sheet header's close button -- has no `label`,
 * so its accessible name and identifier travel as `accessibilityLabel`/
 * `accessibilityIdentifier` modifiers instead, the same way the real
 * component reads them. Falling back to those here (only when `label` is
 * absent) is what lets a test find such a button by role or testID at all.
 */
export function Button({
	children,
	label,
	modifiers,
	onPress,
}: WithModifiers & {label?: string | React.ReactNode; onPress?: () => void}): React.ReactNode {
	if (typeof children === 'string') {
		throw new Error('Button children must be nested elements, not a plain string')
	}

	let labelModifier = modifiers?.find((modifier) => modifier.$type === 'accessibilityLabel')
	let identifierModifier = modifiers?.find(
		(modifier) => modifier.$type === 'accessibilityIdentifier',
	)
	let name = (labelModifier?.label as string | undefined) ?? textOf(label) ?? textOf(children)
	let resolvedLabel = name
	let resolvedTestID = name
		? `button:${name}`
		: identifierModifier
			? `button:${identifierModifier.identifier as string}`
			: undefined

	return (
		<ViewWithModifiers
			accessibilityLabel={resolvedLabel}
			accessibilityRole="button"
			// `RNTL`'s `getByRole` only considers an element an accessibility
			// element -- and so a candidate at all -- once `accessible` is
			// explicitly set; a bare `View` (what this cast really is) defaults to
			// `false`, unlike a real `Button`'s native host view.
			accessible={true}
			modifiers={modifiers}
			onPress={onPress}
			testID={resolvedTestID}
		>
			{children ?? (typeof label === 'string' ? <RNText>{label}</RNText> : label)}
		</ViewWithModifiers>
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
export const menuStyle = (style: string): Modifier => ({$type: 'menuStyle', style})

export const environment = (config: Record<string, unknown>): Modifier => ({
	$type: 'environment',
	...config,
})
export const tag = (value: string | number): Modifier => ({$type: 'tag', value})
