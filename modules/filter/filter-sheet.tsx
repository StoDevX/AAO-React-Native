import * as React from 'react'
import {
	BottomSheet,
	Button,
	Host,
	HStack,
	Image,
	List,
	Section,
	Spacer,
	Text,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	environment,
	font,
	foregroundStyle,
	frame,
	padding,
	resizable,
	shapes,
	tag,
} from '@expo/ui/swift-ui/modifiers'
import type {SFSymbol} from 'sf-symbols-typescript'

import {clearSelection, selectByTitles} from './lib/select-options'
import {TriggerLabel} from './lib/trigger-label'
import {triggerModifiers} from './lib/trigger-modifiers'
import type {FilterIcon, ListItemSpecType, ListType} from './types'

type Props<T extends object> = {
	filter: ListType<T>
	isActive: boolean
	/// The trigger `Button`'s own label -- a sheet has no built-in trigger the
	/// way a `Menu`'s `label` is one, so this component draws its own.
	title: string
	onChange: (filter: ListType<T>) => void
	/// Draws whatever `iconFor` returns for an option; this component never
	/// resolves an icon itself. See the `FilterIcon` contract in `types.ts`.
	iconFor?: (option: ListItemSpecType) => FilterIcon | null
}

/**
 * Names an option row for the UI tests. A row's label is not enough to find it
 * by: the screen behind the sheet states the same station and dietary names,
 * and both stay in the accessibility tree while the sheet is up.
 *
 * Mirrored by `TestIdentifiers.Filter.optionPrefix`,
 * `TestIdentifiers.Filter.clear`, and `TestIdentifiers.Filter.close` in
 * `uitests/TestIdentifiers.swift`.
 */
export const FILTER_OPTION_PREFIX = 'filter-option-'
export const FILTER_CLEAR_ID = 'filter-clear'
/// The header's dismiss button. Its label is a bare glyph, so it needs the
/// same kind of identifier a labelless control always does.
export const FILTER_CLOSE_BUTTON_ID = 'filter-close'

// Constant modifier arrays, hoisted so the worst case -- Course Search's
// Departments filter at 79 rows -- doesn't rebuild the same array, or allocate
// an extra view, once per row. `@expo/ui` view construction costs roughly 3ms
// per view and isn't virtualised.
const ROW_MODIFIERS = [contentShape(shapes.rectangle())]
const LOCAL_ICON_MODIFIERS = [resizable(), frame({width: 20, height: 20})]
// Fills the row so its text takes the full width, leaving the selection circle
// alone at the leading edge. A `Spacer` reads more obviously but costs another
// view on every row --
// `modules/food-menu/food-item-row.tsx` made the same trade for the same
// reason.
const FILL_LEADING = [frame({maxWidth: Infinity, alignment: 'leading'})]
// `modules/food-menu/food-item-row.tsx` styles an option's secondary line the
// same way; hoisted separately here rather than imported, since neither
// module reaches across the package boundary for the other's constants.
const DETAIL_MODIFIERS = [
	font({textStyle: 'footnote'}),
	foregroundStyle({type: 'hierarchical', style: 'secondary'}),
]

const MIN_TOUCH_TARGET = 44
// Both header controls draw smaller than their tappable area needs to be --
// a short text label and a bare glyph both fall well under the 44x44pt
// minimum this project requires on every interactive element -- so each gets
// `contentShape` (so the whole frame, not just the drawn pixels, is what
// registers a tap) and a `frame` floor to match.
const HEADER_HIT_TARGET = [
	contentShape(shapes.rectangle()),
	frame({minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET}),
]
const CLEAR_HEADER_MODIFIERS = [
	buttonStyle('plain'),
	...HEADER_HIT_TARGET,
	accessibilityIdentifier(FILTER_CLEAR_ID),
]
const CLOSE_BUTTON_MODIFIERS = [
	buttonStyle('plain'),
	...HEADER_HIT_TARGET,
	accessibilityLabel('Close'),
	accessibilityIdentifier(FILTER_CLOSE_BUTTON_ID),
]
// `hierarchical`/`secondary` reads as chrome rather than an action -- the
// same treatment a sheet's system-drawn close glyph gets, so a hand-drawn one
// isn't mistaken for a row's own content.
const CLOSE_ICON_MODIFIERS = [foregroundStyle({type: 'hierarchical', style: 'secondary'})]
// Sheet-title idiom: bold/semibold at `title3`, sentence case. A sheet names
// itself the way a navigation title does, so it takes neither the uppercasing
// nor the muted weight a section header carries.
const HEADER_TITLE_MODIFIERS = [font({textStyle: 'title3', weight: 'semibold'})]
// Lets the header's `Spacer` push the close button to the true trailing edge
// before `padding` insets the whole bar from the sheet's actual edges -- see
// `FILL_LEADING` above for the same `frame`-over-`Spacer` trade, applied here
// to the row rather than a single child.
const HEADER_ROW_FILL = [frame({maxWidth: Infinity})]
// An active edit mode is what turns `List(selection:)`'s selected state into
// the circular checkboxes iOS draws while a list is being edited. The
// underlying modifier sets it `.constant`, so the list is always in that state
// rather than animating into it.
const LIST_MODIFIERS = [environment({key: 'editMode', value: 'active'})]
const HEADER_MODIFIERS = [frame({maxWidth: Infinity}), padding({horizontal: 16, vertical: 12})]

/**
 * A long filter -- or one carrying icons -- as a sheet of selectable rows,
 * anchored to its own trigger `Button`, styled identically to `FilterMenu`'s
 * (see `./lib/trigger-modifiers`) so the two presentations aren't
 * distinguishable by looks alone. Taps accumulate in local state; the filter
 * `toggleOption`/`clearSelection` would produce is only handed to `onChange` once,
 * on dismissal, rather than once per row -- a sheet is dismissed as one
 * gesture, not committed row by row.
 */
export function FilterSheet<T extends object>({
	filter,
	isActive,
	title,
	onChange,
	iconFor,
}: Props<T>): React.ReactNode {
	let [isPresented, setIsPresented] = React.useState(false)
	let [local, setLocal] = React.useState(filter)
	// One array per filter rather than one per render: `triggerModifiers` has
	// to build a fresh array to carry the filter's own identifier.
	let anchorModifiers = React.useMemo(
		() => triggerModifiers(isActive, filter.key, {isDisabled: filter.disabled}),
		[isActive, filter.key, filter.disabled],
	)
	// Guards against a second emission for the same presentation. Only
	// `openSheet`/`emitAndDismiss` below touch this -- `BottomSheet.onDismiss`
	// is left unwired below, deliberately: it fires after the dismiss
	// *animation* finishes, measurably later than the state change, and a
	// reopen inside that gap raced this guard's reset against the stale,
	// deferred call -- emitting a second `onChange` and closing the sheet the
	// user had just reopened. `onIsPresentedChange` fires with the state
	// change itself, the same signal a SwiftUI `isPresented` binding uses for
	// every dismissal path, so it isn't subject to that lag.
	let hasEmitted = React.useRef(false)

	// The anchor `Button` is the only thing that opens this sheet, so this is
	// the one place `local` needs to catch up with `filter` (a reopen picks up
	// whatever changed while it was closed) and the emit guard needs
	// resetting -- no effect keyed on `isPresented` is needed, since nothing
	// else can flip it to `true`.
	//
	// That relies on the anchor being unreachable once presented: the default
	// `.large` detent covers it for as long as the sheet is up, so this
	// `setLocal(filter)` reseed can't fire mid-presentation. Adding
	// `presentationDetents` or `fitToContents` would leave the anchor tappable
	// behind a partial sheet, and a tap on it would silently discard whatever
	// the user had already selected.
	let openSheet = React.useCallback(() => {
		hasEmitted.current = false
		setLocal(filter)
		setIsPresented(true)
	}, [filter])

	let emitAndDismiss = React.useCallback(() => {
		if (hasEmitted.current) {
			return
		}
		hasEmitted.current = true
		onChange(local)
		setIsPresented(false)
	}, [local, onChange])

	let {spec} = local
	// SwiftUI matches a selected row by its tag, so the selection crossing that
	// boundary is a list of titles rather than the options themselves.
	let selectedTitles = React.useMemo(
		() => spec.selected.map((option) => option.title),
		[spec.selected],
	)

	// A list with nothing in it has nothing to show -- no rows, and no trigger
	// to open them with. `FilterMenu` returns null for the same reason.
	if (spec.options.length === 0) {
		return null
	}

	return (
		<Host matchContents={true}>
			<BottomSheet
				anchor={
					<Button modifiers={anchorModifiers} onPress={openSheet}>
						<TriggerLabel title={title} />
					</Button>
				}
				isPresented={isPresented}
				onIsPresentedChange={(nextIsPresented) => {
					if (!nextIsPresented) {
						emitAndDismiss()
					}
				}}
			>
				<VStack spacing={0}>
					{/* The (X) commits exactly like a swipe does -- `emitAndDismiss`,
					    never a path that discards `local` -- because a swipe dismissal
					    already applies the user's selections (verified on device); an X
					    that threw them away would make the two dismissal gestures mean
					    opposite things. */}
					<SheetHeader
						canClear={spec.selected.length > 0}
						onClose={emitAndDismiss}
						onClear={() => setLocal((current) => clearSelection(current))}
						title={title}
					/>
					{/* Selection belongs to SwiftUI here: `List(selection:)` under an
					    active edit mode is what draws the circular checkboxes, and it
					    owns the row's tap. A row is therefore plain content carrying a
					    tag, never a `Button` -- a button takes the tap back, and the
					    selection would never change. */}
					<List
						modifiers={LIST_MODIFIERS}
						onSelectionChange={(titles) => {
							setLocal((current) => selectByTitles(current, titles))
						}}
						selection={selectedTitles}
					>
						<Section>
							{/* Plain children rather than `List.ForEach`: under an active
							    edit mode a `ForEach` also draws the delete badge and the
							    reorder grip that go with `onDelete`/`onMove`, and a filter
							    list supports neither. */}
							{spec.options.map((option) => (
								<OptionRow
									key={option.title}
									detail={option.detail}
									icon={iconFor?.(option) ?? null}
									label={spec.displayTitle ? option.title : option.label}
									title={option.title}
								/>
							))}
						</Section>
					</List>
				</VStack>
			</BottomSheet>
		</Host>
	)
}

/**
 * The sheet's own title bar, drawn above the `List` rather than as a section
 * header inside it -- a sheet states its own name the way a navigation title
 * does, not the way a section of rows does. Three slots, in the standard iOS
 * sheet idiom: "Clear" leading (only once something is selected -- an already
 * empty filter has nothing to clear), the filter's name centred, and the (X)
 * dismiss button trailing.
 *
 * The title sits in its own layer, laid over the button row rather than
 * beside it in one `HStack` -- so it stays centred on the sheet regardless of
 * whether "Clear" is present, without the leading slot needing a placeholder
 * to hold its width.
 */
function SheetHeader({
	canClear,
	onClose,
	onClear,
	title,
}: {
	canClear: boolean
	onClose: () => void
	onClear: () => void
	title: string
}): React.ReactNode {
	return (
		<ZStack alignment="center" modifiers={HEADER_MODIFIERS}>
			<HStack modifiers={HEADER_ROW_FILL}>
				{canClear ? (
					<Button label="Clear" modifiers={CLEAR_HEADER_MODIFIERS} onPress={onClear} />
				) : null}
				<Spacer />
				<Button modifiers={CLOSE_BUTTON_MODIFIERS} onPress={onClose}>
					<Image modifiers={CLOSE_ICON_MODIFIERS} systemName="xmark.circle.fill" />
				</Button>
			</HStack>
			<Text modifiers={HEADER_TITLE_MODIFIERS}>{title}</Text>
		</ZStack>
	)
}

function OptionRow({
	detail,
	icon,
	label,
	title,
}: {
	detail?: string
	icon: FilterIcon | null
	label?: string
	/// The option's own title, which names the row for the UI tests. Not the
	/// drawn text: a filter with `displayTitle` off draws `label` instead.
	title: string
}): React.ReactNode {
	// Memoized for the same reason the constants above are hoisted -- Course
	// Search's Departments filter draws 79 of these rows.
	// `tag` is what the enclosing `List(selection:)` matches a selected row by,
	// so it carries the option's own title -- the same value the identifier is
	// built from.
	let modifiers = React.useMemo(
		() => [
			...ROW_MODIFIERS,
			tag(title),
			accessibilityIdentifier(`${FILTER_OPTION_PREFIX}${title}`),
		],
		[title],
	)

	return (
		<HStack modifiers={modifiers} spacing={8}>
			{icon ? <RowIcon icon={icon} /> : null}
			{detail ? (
				<VStack alignment="leading" modifiers={FILL_LEADING} spacing={2}>
					<Text>{label}</Text>
					<Text modifiers={DETAIL_MODIFIERS}>{detail}</Text>
				</VStack>
			) : (
				<Text modifiers={FILL_LEADING}>{label}</Text>
			)}
		</HStack>
	)
}

/// Draws exactly the shape the `FilterIcon` contract promises -- an SF Symbol
/// or a local file -- and nothing else. `resizable()` has to precede `frame()`
/// on the local-file branch, or SwiftUI draws the image at its intrinsic pixel
/// size and it overflows the frame; the sfSymbol branch doesn't need either,
/// since a system image already scales to `font`/`size`.
function RowIcon({icon}: {icon: FilterIcon}): React.ReactNode {
	if (icon.kind === 'sfSymbol') {
		return <Image size={20} systemName={icon.name as SFSymbol} />
	}
	return <Image modifiers={LOCAL_ICON_MODIFIERS} uiImage={icon.uri} />
}
