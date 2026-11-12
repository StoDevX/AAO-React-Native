import * as React from 'react'

import {ListItem} from '@expo/ui'
import {Box, Column, HorizontalDivider, Icon as ComposeIcon} from '@expo/ui/jetpack-compose'
import {
	background,
	clickable,
	clip,
	combinedClickable,
	fillMaxWidth,
	padding,
	Shapes,
	type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, usePalette} from '../colors'
import {
	Claimed,
	ListSelectionContext,
	LongPressContext,
	RowSlotContext,
	type RowPosition,
	type RowSlot,
} from '../context'
import {AxisContext, find, tagOf, toCompose, type ModifierList} from '../modifiers'
import {symbolSource} from './symbol'

/** The full and squared corner radii of a grouped row's card, as FieldSection draws them. */
const FULL_RADIUS = 20
const SMALL_RADIUS = 4
/** The gap between two cards of one section. */
const ROW_GAP = 2
/** The gap above a row that stands alone, outside any section. */
const STANDALONE_GAP = 12
/** A plain row paints nothing, so the list's own surface (or none) shows through. */
const TRANSPARENT = '#00000000'

/** A grouped row card's corners for where it sits in its section. */
function cardShape(position: RowPosition) {
	let top = position === 'only' || position === 'first' ? FULL_RADIUS : SMALL_RADIUS
	let bottom = position === 'only' || position === 'last' ? FULL_RADIUS : SMALL_RADIUS
	return Shapes.RoundedCorner({topStart: top, topEnd: top, bottomStart: bottom, bottomEnd: bottom})
}

/** What a component claiming a row asks of it. */
export type RowCardProps = {
	slot: RowSlot
	/** The claiming view's own SwiftUI modifiers, for `listRow*` and `tag`. */
	modifiers?: ModifierList
	onPress?: () => void
	enabled?: boolean
	leading?: React.ReactNode
	trailing?: React.ReactNode
	supporting?: React.ReactNode
	/**
	 * Whether the row carries the claiming view's own modifiers (its test id,
	 * accessibility label, padding…). False when the view already applied them
	 * to the content it hands over.
	 */
	carriesModifiers?: boolean
	children?: React.ReactNode
}

/**
 * One list row: a Material list item, on a `surfaceContainer` card with
 * FieldSection's corners in a grouped list, or full bleed above a divider in a
 * plain one. Built on the universal `ListItem` for its slots; the click goes
 * in the modifier chain rather than `onPress`, so its ripple sits inside the
 * card's clip and not across the gap between cards.
 *
 * `listRowBackground` recolours the card (`clear` removes it), and
 * `listRowInsets` swaps the list item's own padding for the given insets. In
 * a selecting list a tagged row toggles its tag and shows a check.
 */
export function RowCard({
	slot,
	modifiers,
	onPress,
	enabled = true,
	leading,
	trailing,
	supporting,
	carriesModifiers = true,
	children,
}: RowCardProps): React.ReactNode {
	let palette = usePalette()
	let selection = React.useContext(ListSelectionContext)
	let onLongPress = React.useContext(LongPressContext)
	let grouped = slot.style === 'grouped'

	let rowTag = tagOf(modifiers)
	let isSelected = false
	let press = onPress
	if (selection && rowTag !== undefined) {
		let chosen = selection.selection
		let selected = chosen.includes(rowTag)
		isSelected = selected
		press ??= () =>
			selection.onSelectionChange(
				selected ? chosen.filter((value) => value !== rowTag) : [...chosen, rowTag],
			)
	}

	let rowBackground = find(modifiers, 'listRowBackground')?.color ?? slot.background
	let container =
		rowBackground === undefined
			? grouped
				? palette.colors.surfaceContainer
				: TRANSPARENT
			: (resolveColor(rowBackground, palette) ?? palette.colors.surfaceContainer)
	let transparent = container.endsWith('00') && container.length === 9

	let chain: ModifierConfig[] = [fillMaxWidth()]
	if (slot.spaced) {
		chain.push(padding(0, STANDALONE_GAP, 0, 0))
	}
	if (grouped) {
		if (slot.position === 'first' || slot.position === 'middle') {
			chain.push(padding(0, 0, 0, ROW_GAP))
		}
		if (!transparent) {
			chain.push(clip(cardShape(slot.position)))
		}
	}
	if (press && enabled) {
		chain.push(
			onLongPress
				? combinedClickable({onClick: press, onLongClick: onLongPress})
				: clickable(press),
		)
	} else if (onLongPress) {
		chain.push(combinedClickable({onLongClick: onLongPress}))
	}
	if (carriesModifiers) {
		chain.push(...toCompose(modifiers, {palette, skipTaps: true}))
	}

	let insets = find(modifiers, 'listRowInsets')
	let check = isSelected ? (
		<ComposeIcon size={24} source={symbolSource('checkmark')} tint={palette.colors.primary} />
	) : null

	let row: React.ReactNode
	if (insets) {
		let inset = (key: string): number => (typeof insets[key] === 'number' ? insets[key] : 0)
		row = (
			<Box
				contentAlignment="centerStart"
				modifiers={[
					...chain,
					background(container),
					padding(inset('leading'), inset('top'), inset('trailing'), inset('bottom')),
				]}
			>
				{children}
			</Box>
		)
	} else {
		row = (
			<ListItem
				colors={{containerColor: container}}
				leading={leading ?? undefined}
				modifiers={chain}
				supportingText={supporting ?? undefined}
				trailing={trailing ?? check ?? undefined}
			>
				{children}
			</ListItem>
		)
	}

	let content = (
		<AxisContext.Provider value="none">
			<Claimed>{row}</Claimed>
		</AxisContext.Provider>
	)
	if (!grouped && slot.divider) {
		return (
			<Column modifiers={[fillMaxWidth()]}>
				{content}
				<HorizontalDivider color={palette.colors.outlineVariant} />
			</Column>
		)
	}
	return content
}

/** The row slot this view may claim, if it is the outermost view of a list row. */
export function useRowSlot(): RowSlot | null {
	return React.useContext(RowSlotContext)
}

/**
 * Draws a view as its list row when it is a row's outermost view, and as
 * itself otherwise. Children of the row can no longer claim it.
 */
export function asRow(
	slot: RowSlot | null,
	element: React.ReactNode,
	modifiers?: ModifierList,
): React.ReactNode {
	if (!slot) {
		return element
	}
	return (
		<RowCard carriesModifiers={false} modifiers={modifiers} slot={slot}>
			{element}
		</RowCard>
	)
}
