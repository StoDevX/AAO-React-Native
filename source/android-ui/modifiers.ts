import * as React from 'react'

import {
	alpha,
	background,
	border,
	blur,
	clickable,
	clip,
	combinedClickable,
	defaultMinSize,
	fillMaxHeight,
	fillMaxWidth,
	graphicsLayer,
	height,
	offset,
	onGloballyPositioned,
	padding,
	rotate,
	semantics,
	Shapes,
	size,
	testID,
	weight,
	width,
	wrapContentHeight,
	wrapContentWidth,
	zIndex,
	type BuiltinShape,
	type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, type ColorInput, type Palette} from './colors'
import {type FontParams} from './typography'

/**
 * One SwiftUI modifier as `@expo/ui/swift-ui/modifiers` builds it: a `$type`
 * tag, its parameters, and for the event modifiers the listener to call.
 * Those factories are plain functions returning these objects, so the screens
 * keep importing them on Android and this module reads what they built.
 */
export type SwiftModifier = {
	$type: string
	eventListener?: (args: never) => unknown
	[key: string]: unknown
}

/** The `modifiers` prop as a screen passes it, holes and all. */
export type ModifierList = readonly unknown[] | undefined

/**
 * How each SwiftUI modifier the app uses is handled on Android -- the one
 * place that says which are translated and which are deliberately dropped.
 *
 * - `compose`: becomes Compose modifiers in the chain `toCompose` builds.
 * - `environment`: inherited by descendants, the way SwiftUI's environment
 *   is (`font` on a `VStack` reaches every `Text` in it); see `Environment`.
 * - `component`: read by the component it sits on (`listStyle` by `List`,
 *   `tag` by `Picker`, `presentationDetents` by `BottomSheet`…).
 * - `ignored`: no Android meaning, or none Expo UI's Compose surface can
 *   express; dropped without a warning.
 */
export const MODIFIER_TABLE: Readonly<
	Record<string, readonly ['compose' | 'environment' | 'component' | 'ignored', string]>
> = {
	padding: ['compose', 'padding(start, top, end, bottom); `default` is 16dp'],
	frame: [
		'compose',
		'fixed width/height → size/width/height; maxWidth/maxHeight ≥ 1000 → weight(1) along a Row/Column axis, else fillMaxWidth/Height; then wrapContent with the frame alignment; minWidth/minHeight → defaultMinSize; a finite max is dropped',
	],
	background: ['compose', 'clip(shape) when one is given, then background(colour)'],
	clipShape: ['compose', 'clip(shape)'],
	clipped: ['compose', 'clip(rectangle)'],
	mask: ['compose', 'clip(shape)'],
	cornerRadius: ['compose', 'clip(roundedCorner)'],
	opacity: ['compose', 'alpha'],
	hidden: ['compose', 'alpha(0), keeping its space as SwiftUI does'],
	offset: ['compose', 'offset(x, y)'],
	border: ['compose', 'border(width, colour)'],
	scaleEffect: ['compose', 'graphicsLayer(scaleX, scaleY)'],
	rotationEffect: ['compose', 'rotate'],
	zIndex: ['compose', 'zIndex'],
	blur: ['compose', 'blur'],
	accessibilityIdentifier: ['compose', 'testID (Compose test tag; resource-id with testTagsAsResourceId)'],
	accessibilityLabel: ['compose', 'semantics(contentDescription), with accessibilityValue appended'],
	accessibilityValue: ['compose', 'appended to the contentDescription'],
	onTapGesture: ['compose', 'clickable without ripple, as a tap gesture draws none'],
	onLongPressGesture: ['compose', 'combinedClickable(onLongClick)'],
	onGeometryChange: ['compose', 'onGloballyPositioned'],
	onAppear: ['component', 'a mount effect'],
	onDisappear: ['component', 'an unmount effect'],
	id: ['component', 'a React key, so a new id rebuilds the view as SwiftUI does'],
	font: ['environment', 'Material type role (see typography.ts); size/weight/design honoured'],
	foregroundStyle: ['environment', 'content colour; iOS semantic colours become Material roles'],
	foregroundColor: ['environment', 'as foregroundStyle'],
	tint: ['environment', 'accent for controls and button labels'],
	bold: ['environment', 'fontWeight 700'],
	italic: ['environment', 'fontStyle italic'],
	underline: ['environment', 'textDecoration underline'],
	strikethrough: ['environment', 'textDecoration lineThrough'],
	kerning: ['environment', 'letterSpacing'],
	lineSpacing: ['environment', 'lineHeight = font size × 1.2 + spacing'],
	lineHeight: ['environment', 'lineHeight'],
	lineLimit: ['environment', 'maxLines (and minLines for a range or reservesSpace)'],
	multilineTextAlignment: ['environment', 'textAlign'],
	truncationMode: ['environment', 'overflow ellipsis (Compose ellipsises at the end only)'],
	textCase: ['environment', 'the string upper- or lower-cased'],
	disabled: ['environment', 'enabled = false on every control beneath'],
	buttonStyle: ['environment', 'borderedProminent/glassProminent → Button, bordered/glass → FilledTonalButton, borderless/plain/automatic → TextButton'],
	buttonBorderShape: ['component', 'the Material button shape'],
	controlSize: ['environment', 'large/extraLarge buttons fill the width'],
	pickerStyle: ['environment', 'segmented → SingleChoiceSegmentedButtonRow; menu/automatic → exposed dropdown'],
	labelsHidden: ['environment', 'drops a control’s own label'],
	menuActionDismissBehavior: ['environment', 'disabled keeps a menu open after an item is chosen'],
	listStyle: ['component', 'plain → full-bleed rows with dividers; anything else → inset grouped cards'],
	listRowBackground: ['component', 'the row card’s container colour; clear drops the card'],
	listRowInsets: ['component', 'replaces the ListItem padding with these insets'],
	scrollContentBackground: ['component', 'hidden → the list paints no surface of its own'],
	refreshable: ['component', 'PullToRefreshBox around List/ScrollView/stack'],
	tag: ['component', 'a Picker option’s value, or a selectable row’s id'],
	presentationDetents: ['component', 'medium/fraction < 1 → half-expanded sheet; large only → skip partial'],
	presentationDragIndicator: ['component', 'ModalBottomSheet drag handle'],
	presentationBackground: ['component', 'ModalBottomSheet containerColor'],
	interactiveDismissDisabled: ['component', 'sheet ignores back and outside taps'],
	tabViewStyle: ['component', 'every TabView is a HorizontalPager'],
	datePickerStyle: ['component', 'compact → row that expands to the picker; graphical/wheel → inline picker'],
	imageScale: ['component', 'icon size × 0.75 / 1 / 1.25'],
	resizable: ['component', 'icon takes its frame size'],
	keyboardType: ['component', 'TextInput keyboardType'],
	textInputAutocapitalization: ['component', 'TextInput autoCapitalize'],
	autocorrectionDisabled: ['component', 'TextInput autoCorrect'],
	submitLabel: ['component', 'TextInput returnKeyType'],
	onSubmit: ['component', 'TextInput onSubmitEditing'],
	textContentType: ['ignored', 'Android autofill hints are not exposed by Expo UI'],
	accessibilityHint: ['ignored', 'Compose semantics in Expo UI carry no hint'],
	accessibilityHidden: ['ignored', 'Expo UI’s semantics modifier cannot clear semantics'],
	accessibilityAddTraits: ['ignored', 'no heading/selected semantics in Expo UI; buttons and switches carry their own roles'],
	accessibilityRemoveTraits: ['ignored', 'as accessibilityAddTraits'],
	accessibilityElement: ['ignored', 'no mergeDescendants in Expo UI'],
	contentShape: ['ignored', 'Compose hit-tests a clickable’s whole bounds already'],
	shadow: ['ignored', 'an unshaped Compose shadow draws a rectangle; Material uses tonal surfaces'],
	listRowSeparator: ['ignored', 'Material lists separate by spacing, not hairlines'],
	listRowSeparatorTint: ['ignored', 'as listRowSeparator'],
	listSectionSpacing: ['ignored', 'Material spacing is fixed'],
	alignmentGuide: ['ignored', 'separator insets only'],
	textSelection: ['ignored', 'Expo UI’s Text has no SelectionContainer'],
	minimumScaleFactor: ['ignored', 'no auto-sizing text'],
	allowsTightening: ['ignored', 'no auto-sizing text'],
	monospacedDigit: ['ignored', 'no tabular figures in Expo UI’s text style'],
	fixedSize: ['ignored', 'Compose text never truncates to fit unless maxLines says so'],
	layoutPriority: ['ignored', 'no Compose equivalent'],
	aspectRatio: ['ignored', 'not in Expo UI’s modifier set'],
	containerRelativeFrame: ['ignored', 'not in Expo UI’s modifier set'],
	ignoreSafeArea: ['ignored', 'the RN layout around the Host owns insets'],
	dynamicTypeSize: ['ignored', 'Material type follows the system font scale'],
	environment: ['ignored', 'colorScheme/editMode overrides have no Compose counterpart here'],
	presentationCornerRadius: ['ignored', 'Material sheets have fixed corners'],
	presentationBackgroundInteraction: ['ignored', 'ModalBottomSheet is always modal'],
	menuOrder: ['ignored', 'Material menus keep source order'],
	menuIndicator: ['ignored', 'Material menu anchors draw no indicator'],
	scrollTargetBehavior: ['ignored', 'no snapping in Expo UI’s scroll modifiers'],
	scrollTargetLayout: ['ignored', 'as scrollTargetBehavior'],
	scrollPosition: ['ignored', 'no scroll state in Expo UI’s Column/Row'],
	onScrollGeometryChange: ['ignored', 'as scrollPosition'],
	onScrollPhaseChange: ['ignored', 'as scrollPosition'],
	redacted: ['ignored', 'no placeholder redaction'],
	animation: ['ignored', 'Compose animates its own state changes'],
	contentTransition: ['ignored', 'as animation'],
	glassEffect: ['ignored', 'Liquid Glass is iOS-only'],
}

/** At or beyond this many points, a frame's max size means "as large as offered". */
const FILL_THRESHOLD = 1000

/** SwiftUI's `padding()` default, which is the Material screen margin too. */
const DEFAULT_PADDING = 16

/** Which way the enclosing Compose layout stacks its children. */
export type Axis = 'row' | 'column' | 'box' | 'none'

/**
 * The enclosing layout's axis. A SwiftUI frame that grows to fill a stack
 * shares the stack's space with its siblings, which in Compose is `weight`,
 * a modifier only a Row or Column child may carry.
 */
export const AxisContext = React.createContext<Axis>('none')

/** The modifiers a screen passed, without the holes a conditional leaves. */
export function modifiersOf(list: ModifierList): SwiftModifier[] {
	if (!list) {
		return []
	}
	return list.filter(
		(item): item is SwiftModifier =>
			typeof item === 'object' && item !== null && typeof (item as SwiftModifier).$type === 'string',
	)
}

/** The last modifier of a type, which is the one SwiftUI applies outermost. */
export function find(list: ModifierList, type: string): SwiftModifier | undefined {
	let all = modifiersOf(list)
	for (let index = all.length - 1; index >= 0; index -= 1) {
		if (all[index].$type === type) {
			return all[index]
		}
	}
	return undefined
}

/** One string parameter of the last modifier of a type. */
export function stringParam(list: ModifierList, type: string, key: string): string | undefined {
	let value = find(list, type)?.[key]
	return typeof value === 'string' ? value : undefined
}

/** A numeric parameter, or undefined. */
function num(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Whether a frame's max size asks for all the room on offer. */
function fills(value: unknown): boolean {
	return value === Infinity || (typeof value === 'number' && value >= FILL_THRESHOLD)
}

/** A SwiftUI shape, by its payload, as a Compose shape. */
export function shapeOf(name: unknown, cornerRadius?: unknown): BuiltinShape {
	switch (name) {
		case 'circle':
		case 'ellipse':
			return Shapes.Circle
		case 'capsule':
			// RoundedCornerShape clamps to half the short side, which is a capsule.
			return Shapes.RoundedCorner(1000)
		case 'roundedRectangle':
		case 'containerRelativeShape':
			return Shapes.RoundedCorner(num(cornerRadius) ?? 8)
		default:
			return Shapes.Rectangle
	}
}

/** A frame's alignment, split into Compose's horizontal and vertical halves. */
function frameAlignment(
	alignment: unknown,
): ['start' | 'centerHorizontally' | 'end', 'top' | 'centerVertically' | 'bottom'] {
	let name = typeof alignment === 'string' ? alignment.toLowerCase() : 'center'
	let horizontal: 'start' | 'centerHorizontally' | 'end' = name.includes('leading')
		? 'start'
		: name.includes('trailing')
			? 'end'
			: 'centerHorizontally'
	let vertical: 'top' | 'centerVertically' | 'bottom' = name.startsWith('top')
		? 'top'
		: name.startsWith('bottom')
			? 'bottom'
			: 'centerVertically'
	return [horizontal, vertical]
}

/** The Compose modifiers a `frame(…)` stands for, outermost first. */
function frameModifiers(params: SwiftModifier, axis: Axis): ModifierConfig[] {
	let out: ModifierConfig[] = []
	let [alignX, alignY] = frameAlignment(params.alignment)
	let fixedWidth = num(params.width)
	let fixedHeight = num(params.height)
	let fillWidth = fills(params.maxWidth)
	let fillHeight = fills(params.maxHeight)

	if (fixedWidth !== undefined && fixedHeight !== undefined) {
		out.push(size(fixedWidth, fixedHeight))
	} else if (fixedWidth !== undefined) {
		out.push(width(fixedWidth))
	} else if (fixedHeight !== undefined) {
		out.push(height(fixedHeight))
	}

	if (fillWidth) {
		out.push(axis === 'row' ? weight(1) : fillMaxWidth())
	}
	if (fillHeight) {
		out.push(axis === 'column' ? weight(1) : fillMaxHeight())
	}

	let minWidth = num(params.minWidth)
	let minHeight = num(params.minHeight)
	if (minWidth !== undefined || minHeight !== undefined) {
		out.push(defaultMinSize({minWidth, minHeight}))
	}

	// SwiftUI centres (or aligns) the content inside the frame it proposes.
	if (fixedWidth !== undefined || fillWidth) {
		out.push(wrapContentWidth(alignX))
	}
	if (fixedHeight !== undefined || fillHeight) {
		out.push(wrapContentHeight(alignY))
	}
	return out
}

/** A padding edge, with SwiftUI's `'default'` as the Material margin. */
function edge(...candidates: unknown[]): number {
	for (let candidate of candidates) {
		if (candidate === 'default') {
			return DEFAULT_PADDING
		}
		let value = num(candidate)
		if (value !== undefined) {
			return value
		}
	}
	return 0
}

/** The Compose padding a SwiftUI `padding(…)` asks for. */
function paddingModifier(params: SwiftModifier): ModifierConfig {
	let keys = ['all', 'horizontal', 'vertical', 'top', 'bottom', 'leading', 'trailing']
	if (!keys.some((key) => params[key] !== undefined)) {
		return padding(DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING, DEFAULT_PADDING)
	}
	let start = edge(params.leading, params.horizontal, params.all)
	let end = edge(params.trailing, params.horizontal, params.all)
	let top = edge(params.top, params.vertical, params.all)
	let bottom = edge(params.bottom, params.vertical, params.all)
	return padding(start, top, end, bottom)
}

/** Calls a SwiftUI modifier's own listener with what native would have sent. */
function fire(modifier: SwiftModifier, args?: unknown): void {
	let listener = modifier.eventListener as ((value: unknown) => unknown) | undefined
	try {
		let result = listener?.(args)
		if (result instanceof Promise) {
			result.catch(() => {})
		}
	} catch (error) {
		console.warn(`[android-ui] ${modifier.$type} handler threw`, error)
	}
}

/** Options for `toCompose`: what the translation needs from where it runs. */
export type ComposeOptions = {
	palette: Palette
	axis?: Axis
	/** Leave out taps: the component already wires its own click. */
	skipTaps?: boolean
}

/**
 * Translates SwiftUI modifiers into the Compose modifier chain that means the
 * same, ready to hand to an `@expo/ui/jetpack-compose` view. Every component
 * here goes through it.
 *
 * SwiftUI applies a modifier list inside out (`padding` then `background`
 * paints behind the padding) and Compose outside in, so the translated
 * groups are reversed: the last SwiftUI modifier becomes the outermost
 * Compose one. Modifiers that are environment, component or ignored per
 * `MODIFIER_TABLE` contribute nothing here.
 */
export function toCompose(list: ModifierList, options: ComposeOptions): ModifierConfig[] {
	let {palette, axis = 'none', skipTaps = false} = options
	let groups: ModifierConfig[][] = []
	let all = modifiersOf(list)
	let accessibilityValue = stringParam(all, 'accessibilityValue', 'value')

	for (let modifier of all) {
		let group: ModifierConfig[] = []
		switch (modifier.$type) {
			case 'padding':
				group.push(paddingModifier(modifier))
				break
			case 'frame':
				group.push(...frameModifiers(modifier, axis))
				break
			case 'background': {
				let color = resolveColor(modifier.style as ColorInput, palette)
				if (color) {
					if (typeof modifier.shape === 'string') {
						group.push(clip(shapeOf(modifier.shape, modifier.cornerRadius)))
					}
					group.push(background(color))
				}
				break
			}
			case 'clipShape':
			case 'mask':
				group.push(clip(shapeOf(modifier.shape, modifier.cornerRadius)))
				break
			case 'clipped':
				if (modifier.clipped !== false) {
					group.push(clip(Shapes.Rectangle))
				}
				break
			case 'cornerRadius':
				group.push(clip(Shapes.RoundedCorner(num(modifier.radius) ?? 0)))
				break
			case 'opacity': {
				let value = num(modifier.value)
				if (value !== undefined) {
					group.push(alpha(Math.min(1, Math.max(0, value))))
				}
				break
			}
			case 'hidden':
				if (modifier.hidden !== false) {
					group.push(alpha(0))
				}
				break
			case 'offset':
				group.push(offset(num(modifier.x) ?? 0, num(modifier.y) ?? 0))
				break
			case 'border': {
				let color = resolveColor(modifier.content as ColorInput, palette)
				if (color) {
					group.push(border(num(modifier.width) ?? 1, color))
				}
				break
			}
			case 'scaleEffect':
				group.push(graphicsLayer({scaleX: num(modifier.x) ?? 1, scaleY: num(modifier.y) ?? 1}))
				break
			case 'rotationEffect':
				group.push(rotate(num(modifier.angle) ?? 0))
				break
			case 'zIndex':
				group.push(zIndex(num(modifier.index) ?? 0))
				break
			case 'blur':
				group.push(blur(num(modifier.radius) ?? 0))
				break
			case 'accessibilityIdentifier':
				if (typeof modifier.identifier === 'string') {
					group.push(testID(modifier.identifier))
				}
				break
			case 'accessibilityLabel':
				if (typeof modifier.label === 'string') {
					let description = accessibilityValue
						? `${modifier.label}, ${accessibilityValue}`
						: modifier.label
					group.push(semantics({contentDescription: description}))
				}
				break
			case 'onTapGesture':
				if (!skipTaps) {
					group.push(clickable(() => fire(modifier), {indication: false}))
				}
				break
			case 'onLongPressGesture':
				if (!skipTaps) {
					group.push(combinedClickable({onLongClick: () => fire(modifier)}, {indication: false}))
				}
				break
			case 'onGeometryChange':
				group.push(onGloballyPositioned((layout) => fire(modifier, layout)))
				break
			default:
				break
		}
		groups.push(group)
	}
	return groups.reverse().flat()
}

/**
 * Calls `onAppear` and `onDisappear` handlers when the component mounts and
 * unmounts, which is when SwiftUI calls them for a view that stays on screen.
 */
export function useLifecycle(list: ModifierList): void {
	let all = modifiersOf(list)
	let appear = all.find((modifier) => modifier.$type === 'onAppear')
	let disappear = all.find((modifier) => modifier.$type === 'onDisappear')
	let latest = React.useRef({appear, disappear})
	latest.current = {appear, disappear}
	React.useEffect(() => {
		let {appear: onAppear} = latest.current
		if (onAppear) {
			fire(onAppear)
		}
		return () => {
			let {disappear: onDisappear} = latest.current
			if (onDisappear) {
				fire(onDisappear)
			}
		}
	}, [])
}

/** The value an `id(…)` modifier carries, which keys the view's identity. */
export function identityOf(list: ModifierList): string | undefined {
	let value = find(list, 'id')?.id
	return value === undefined || value === null ? undefined : String(value)
}

/** The value a `tag(…)` modifier carries. */
export function tagOf(list: ModifierList): string | number | undefined {
	let value = find(list, 'tag')?.tag
	return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

/** The `accessibilityIdentifier(…)` on a view, if any. */
export function identifierOf(list: ModifierList): string | undefined {
	return stringParam(list, 'accessibilityIdentifier', 'identifier')
}

/** The `accessibilityLabel(…)` on a view, if any. */
export function labelOf(list: ModifierList): string | undefined {
	return stringParam(list, 'accessibilityLabel', 'label')
}

/**
 * Runs a `refreshable(…)` handler and settles when the caller's own promise
 * does. The modifier's listener also tells the iOS module the refresh ended;
 * Android has no such call, so that half rejects and is swallowed here.
 */
export async function runRefresh(modifier: SwiftModifier): Promise<void> {
	let listener = modifier.eventListener as ((value: unknown) => unknown) | undefined
	try {
		await listener?.({id: 'android'})
	} catch {
		// `completeRefresh` is iOS-only; the caller's handler has finished by now.
	}
}

/**
 * The SwiftUI environment as far as this layer models it: the modifiers a
 * container passes down to every view inside it.
 */
export type Environment = {
	font?: FontParams
	foreground?: ColorInput
	tint?: ColorInput
	bold?: boolean
	italic?: boolean
	underline?: boolean
	strikethrough?: boolean
	kerning?: number
	lineSpacing?: number
	lineHeight?: number
	lineLimit?: {max?: number; min?: number}
	textAlign?: 'start' | 'center' | 'end'
	truncate?: boolean
	textCase?: 'uppercase' | 'lowercase'
	disabled?: boolean
	buttonStyle?: string
	controlSize?: string
	pickerStyle?: string
	labelsHidden?: boolean
	menuStaysOpen?: boolean
}

/** The environment above the current view. */
export const EnvironmentContext = React.createContext<Environment>({})

/** The environment a view's own modifiers set, layered over its parent's. */
export function mergeEnvironment(parent: Environment, list: ModifierList): Environment {
	let all = modifiersOf(list)
	if (all.length === 0) {
		return parent
	}
	let env: Environment = {...parent}
	for (let modifier of all) {
		switch (modifier.$type) {
			case 'font':
				env.font = {...env.font, ...(modifier as FontParams)}
				break
			case 'foregroundStyle':
				env.foreground = modifier.style as ColorInput
				break
			case 'foregroundColor':
				env.foreground = modifier.color as ColorInput
				break
			case 'tint':
				env.tint = modifier.tint as ColorInput
				break
			case 'bold':
				env.bold = true
				break
			case 'italic':
				env.italic = true
				break
			case 'underline':
				env.underline = modifier.isActive !== false
				break
			case 'strikethrough':
				env.strikethrough = modifier.isActive !== false
				break
			case 'kerning':
				env.kerning = num(modifier.value)
				break
			case 'lineSpacing':
				env.lineSpacing = num(modifier.value)
				break
			case 'lineHeight':
				env.lineHeight = num(modifier.value)
				break
			case 'lineLimit': {
				let limit = num(modifier.limit)
				let max = num(modifier.max) ?? limit
				let min = num(modifier.min) ?? (modifier.reservesSpace ? limit : undefined)
				env.lineLimit = {max, min}
				break
			}
			case 'multilineTextAlignment':
				env.textAlign =
					modifier.alignment === 'center'
						? 'center'
						: modifier.alignment === 'trailing'
							? 'end'
							: 'start'
				break
			case 'truncationMode':
				env.truncate = true
				break
			case 'textCase':
				env.textCase =
					modifier.value === 'uppercase' || modifier.value === 'lowercase'
						? modifier.value
						: undefined
				break
			case 'disabled':
				env.disabled = modifier.disabled !== false || parent.disabled === true
				break
			case 'buttonStyle':
				env.buttonStyle = typeof modifier.style === 'string' ? modifier.style : undefined
				break
			case 'controlSize':
				env.controlSize = typeof modifier.size === 'string' ? modifier.size : undefined
				break
			case 'pickerStyle':
				env.pickerStyle = typeof modifier.style === 'string' ? modifier.style : undefined
				break
			case 'labelsHidden':
				env.labelsHidden = true
				break
			case 'menuActionDismissBehavior':
				env.menuStaysOpen = modifier.behavior === 'disabled'
				break
			default:
				break
		}
	}
	return env
}

/**
 * The environment for a view: its parent's with its own modifiers layered
 * on. Memoised on the modifier list's identity, which the screens hoist into
 * constants for exactly this kind of reuse.
 */
export function useEnvironment(list: ModifierList): Environment {
	let parent = React.useContext(EnvironmentContext)
	return React.useMemo(() => mergeEnvironment(parent, list), [parent, list])
}
