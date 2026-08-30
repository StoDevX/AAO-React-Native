import * as React from 'react'
import {
	BottomSheet,
	Button,
	Host,
	HStack,
	Image,
	List,
	Section,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	resizable,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import isEqual from 'lodash/isEqual'
import type {SFSymbol} from 'sf-symbols-typescript'

import {toggleAll, toggleOption} from './lib/select-options'
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
 * Mirrored by `TestIdentifiers.Filter.optionPrefix` and
 * `TestIdentifiers.Filter.showAll` in `uitests/TestIdentifiers.swift`.
 */
export const FILTER_OPTION_PREFIX = 'filter-option-'
export const FILTER_SHOW_ALL_ID = 'filter-show-all'

// Constant modifier arrays, hoisted so the worst case -- Course Search's
// Departments filter at 79 rows, in `OR` mode with everything selected, so
// every row draws a checkmark -- doesn't rebuild the same array, or allocate
// an extra view, once per row. `@expo/ui` view construction costs roughly
// 3ms per view and isn't virtualised.
const PLAIN_BUTTON_MODIFIERS = [buttonStyle('plain')]
// "Show All" is one row with one identifier, so its modifiers hoist with the
// rest; an option row's identifier varies, so that array is memoized per row.
const SHOW_ALL_MODIFIERS = [buttonStyle('plain'), accessibilityIdentifier(FILTER_SHOW_ALL_ID)]
const ROW_MODIFIERS = [contentShape(shapes.rectangle())]
const LOCAL_ICON_MODIFIERS = [resizable(), frame({width: 20, height: 20})]
// Fills the row so the checkmark settles against the trailing edge. A
// `Spacer` reads more obviously but costs another view on every row --
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

/**
 * A long filter -- or one carrying icons -- as a sheet of selectable rows,
 * anchored to its own trigger `Button`, styled identically to `FilterMenu`'s
 * (see `./lib/trigger-modifiers`) so the two presentations aren't
 * distinguishable by looks alone. Taps accumulate in local state; the filter
 * `toggleOption`/`toggleAll` would produce is only handed to `onChange` once,
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
		() => triggerModifiers(isActive, filter.key),
		[isActive, filter.key],
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

	// A list with nothing in it has nothing to show -- no rows, and no trigger
	// to open them with. `FilterMenu` returns null for the same reason.
	if (spec.options.length === 0) {
		return null
	}

	let allSelected = spec.selected.length === spec.options.length

	return (
		<Host matchContents={true}>
			<BottomSheet
				anchor={<Button label={title} modifiers={anchorModifiers} onPress={openSheet} />}
				isPresented={isPresented}
				onIsPresentedChange={(nextIsPresented) => {
					if (!nextIsPresented) {
						emitAndDismiss()
					}
				}}
			>
				<List>
					{/* `title` rather than a `header` element: it draws in the system's
					    own section-header style, which is what `FilterMenu` gets from
					    the same prop. A `<Text>` in `header` renders as body copy, so
					    the two presentations would state the filter's name in visibly
					    different type. */}
					<Section title={title.toUpperCase()}>
						{spec.mode === 'OR' ? (
							<ShowAllRow
								isSelected={allSelected}
								onPress={() => setLocal((current) => toggleAll(current))}
							/>
						) : null}
						<List.ForEach>
							{spec.options.map((option) => (
								<OptionRow
									key={option.title}
									detail={option.detail}
									icon={iconFor?.(option) ?? null}
									isSelected={spec.selected.some((selected) => isEqual(selected, option))}
									label={spec.displayTitle ? option.title : option.label}
									onPress={() => setLocal((current) => toggleOption(current, option))}
									title={option.title}
								/>
							))}
						</List.ForEach>
					</Section>
				</List>
			</BottomSheet>
		</Host>
	)
}

function OptionRow({
	detail,
	icon,
	isSelected,
	label,
	onPress,
	title,
}: {
	detail?: string
	icon: FilterIcon | null
	isSelected: boolean
	label?: string
	onPress: () => void
	/// The option's own title, which names the row for the UI tests. Not the
	/// drawn text: a filter with `displayTitle` off draws `label` instead.
	title: string
}): React.ReactNode {
	// Memoized for the same reason the constants above are hoisted -- Course
	// Search's Departments filter draws 79 of these rows.
	let modifiers = React.useMemo(
		() => [...PLAIN_BUTTON_MODIFIERS, accessibilityIdentifier(`${FILTER_OPTION_PREFIX}${title}`)],
		[title],
	)

	return (
		<Button modifiers={modifiers} onPress={onPress}>
			{/* contentShape belongs on the label (this HStack), not the Button --
			    see building-picker's BuildingRow for why: a Button's tappable
			    region comes from its label, so anything past the label is
			    otherwise dead to taps. */}
			<HStack modifiers={ROW_MODIFIERS} spacing={8}>
				{icon ? <RowIcon icon={icon} /> : null}
				{detail ? (
					<VStack alignment="leading" modifiers={FILL_LEADING} spacing={2}>
						<Text>{label}</Text>
						<Text modifiers={DETAIL_MODIFIERS}>{detail}</Text>
					</VStack>
				) : (
					<Text modifiers={FILL_LEADING}>{label}</Text>
				)}
				{isSelected ? <Image systemName="checkmark" /> : null}
			</HStack>
		</Button>
	)
}

function ShowAllRow({
	isSelected,
	onPress,
}: {
	isSelected: boolean
	onPress: () => void
}): React.ReactNode {
	return (
		<Button modifiers={SHOW_ALL_MODIFIERS} onPress={onPress}>
			<HStack modifiers={ROW_MODIFIERS} spacing={8}>
				<Text modifiers={FILL_LEADING}>Show All</Text>
				{isSelected ? <Image systemName="checkmark" /> : null}
			</HStack>
		</Button>
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
