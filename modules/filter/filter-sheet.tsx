import * as React from 'react'
import {BottomSheet, Button, Host, HStack, Image, List, Section, Text} from '@expo/ui/swift-ui'
import {buttonStyle, contentShape, frame, resizable, shapes} from '@expo/ui/swift-ui/modifiers'
import isEqual from 'lodash/isEqual'
import type {SFSymbol} from 'sf-symbols-typescript'

import {toggleAll, toggleOption} from './lib/select-options'
import type {FilterIcon, ListItemSpecType, ListType} from './types'

type Props<T extends object> = {
	filter: ListType<T>
	isPresented: boolean
	onDismiss: () => void
	onChange: (filter: ListType<T>) => void
	/// Draws whatever `iconFor` returns for an option; this component never
	/// resolves an icon itself. See the `FilterIcon` contract in `types.ts`.
	iconFor?: (option: ListItemSpecType) => FilterIcon | null
}

// Constant modifier arrays, hoisted so the worst case -- Course Search's
// Departments filter at 79 rows, in `OR` mode with everything selected, so
// every row draws a checkmark -- doesn't rebuild the same array, or allocate
// an extra view, once per row. `@expo/ui` view construction costs roughly
// 3ms per view and isn't virtualised.
const PLAIN_BUTTON_MODIFIERS = [buttonStyle('plain')]
const ROW_MODIFIERS = [contentShape(shapes.rectangle())]
const LOCAL_ICON_MODIFIERS = [resizable(), frame({width: 20, height: 20})]
// Fills the row so the checkmark settles against the trailing edge. A
// `Spacer` reads more obviously but costs another view on every row --
// `modules/food-menu/food-item-row.tsx` made the same trade for the same
// reason.
const FILL_LEADING = [frame({maxWidth: Infinity, alignment: 'leading'})]

/**
 * A long filter -- or one carrying icons -- as a sheet of selectable rows.
 * Taps accumulate in local state; the filter `toggleOption`/`toggleAll` would
 * produce is only handed to `onChange` once, on dismissal, rather than once
 * per row -- a sheet is dismissed as one gesture, not committed row by row.
 */
export function FilterSheet<T extends object>({
	filter,
	isPresented,
	onDismiss,
	onChange,
	iconFor,
}: Props<T>): React.ReactNode {
	let [local, setLocal] = React.useState(filter)
	// Guards against a second emission for the same presentation. Only
	// `onIsPresentedChange` drives this -- `BottomSheet.onDismiss` is left
	// unwired below, deliberately: it fires after the dismiss *animation*
	// finishes, measurably later than the state change, and a reopen inside
	// that gap raced this guard's reset against the stale, deferred call --
	// emitting a second `onChange` and closing the sheet the user had just
	// reopened. `onIsPresentedChange` fires with the state change itself, the
	// same signal a SwiftUI `isPresented` binding uses for every dismissal
	// path, so it isn't subject to that lag. Reset in the effect below, not
	// during render -- a ref must not be written there.
	let hasEmitted = React.useRef(false)

	// Re-seeds `local` from the incoming `filter` each time the sheet opens,
	// so a reopen picks up whatever changed while it was closed. Adjusting
	// state during render, rather than in an effect, avoids the extra
	// render an effect's setState would otherwise cost on every open.
	let [prevIsPresented, setPrevIsPresented] = React.useState(isPresented)
	if (isPresented !== prevIsPresented) {
		setPrevIsPresented(isPresented)
		if (isPresented) {
			setLocal(filter)
		}
	}

	React.useEffect(() => {
		if (isPresented) {
			hasEmitted.current = false
		}
	}, [isPresented])

	let emitAndDismiss = React.useCallback(() => {
		if (hasEmitted.current) {
			return
		}
		hasEmitted.current = true
		onChange(local)
		onDismiss()
	}, [local, onChange, onDismiss])

	let {spec} = local

	// Matches the popover's rule, and `FilterMenu`'s: a list with nothing in it
	// has nothing to show.
	if (spec.options.length === 0) {
		return null
	}

	let allSelected = spec.selected.length === spec.options.length

	return (
		<Host matchContents={true}>
			<BottomSheet
				isPresented={isPresented}
				onIsPresentedChange={(nextIsPresented) => {
					if (!nextIsPresented) {
						emitAndDismiss()
					}
				}}
			>
				<List>
					<Section>
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
									icon={iconFor?.(option) ?? null}
									isSelected={spec.selected.some((selected) => isEqual(selected, option))}
									label={spec.displayTitle ? option.title : option.label}
									onPress={() => setLocal((current) => toggleOption(current, option))}
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
	icon,
	isSelected,
	label,
	onPress,
}: {
	icon: FilterIcon | null
	isSelected: boolean
	label?: string
	onPress: () => void
}): React.ReactNode {
	return (
		<Button modifiers={PLAIN_BUTTON_MODIFIERS} onPress={onPress}>
			{/* contentShape belongs on the label (this HStack), not the Button --
			    see building-picker's BuildingRow for why: a Button's tappable
			    region comes from its label, so anything past the label is
			    otherwise dead to taps. */}
			<HStack modifiers={ROW_MODIFIERS} spacing={8}>
				{icon ? <RowIcon icon={icon} /> : null}
				<Text modifiers={FILL_LEADING}>{label}</Text>
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
		<Button modifiers={PLAIN_BUTTON_MODIFIERS} onPress={onPress}>
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
