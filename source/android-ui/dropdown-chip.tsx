import * as React from 'react'

import {
	Box,
	DropdownMenu,
	DropdownMenuItem,
	FilterChip,
	Host,
	Icon,
	Text,
} from '@expo/ui/jetpack-compose'
import {size} from '@expo/ui/jetpack-compose/modifiers'

import {symbolSource} from './components/symbol'

/** Material 3's filter chip icon size. */
const CHIP_ICON_SIZE = 18

/** A dropdown menu item's icon size. */
const ITEM_ICON_SIZE = 24

/** One choice in a `DropdownChip`'s menu. */
export type DropdownChipOption = {
	key: string
	label: string
	checked: boolean
	onSelect: () => void
}

type Props = {
	/** The chip's text: the filter's name, or the value chosen for it. */
	label: string
	/** Whether the filter narrows anything, which draws the chip selected. */
	selected: boolean
	options: ReadonlyArray<DropdownChipOption>
	/**
	 * Keeps the menu open as options are chosen, for a filter that takes
	 * several at once. A single-choice menu closes on its choice.
	 */
	multiple?: boolean
}

/**
 * A Material filter chip that opens a menu of its options: the dropdown chip
 * of a Material filter row, as Gmail's search filters draw one. Selected, it
 * carries a check before its label; it always ends in a dropdown caret, so it
 * reads as something that opens rather than something that toggles.
 *
 * Android only: it is drawn in Compose.
 */
export function DropdownChip({label, selected, options, multiple = false}: Props): React.ReactNode {
	let [expanded, setExpanded] = React.useState(false)
	let close = React.useCallback(() => setExpanded(false), [])

	return (
		<Host matchContents={true}>
			<DropdownMenu expanded={expanded} onDismissRequest={close}>
				<DropdownMenu.Trigger>
					<FilterChip onClick={() => setExpanded(true)} selected={selected}>
						<FilterChip.Label>
							<Text>{label}</Text>
						</FilterChip.Label>
						{selected ? (
							<FilterChip.LeadingIcon>
								<Icon size={CHIP_ICON_SIZE} source={symbolSource('checkmark')} />
							</FilterChip.LeadingIcon>
						) : null}
						<FilterChip.TrailingIcon>
							<Icon size={CHIP_ICON_SIZE} source={symbolSource('arrowtriangle.down.fill')} />
						</FilterChip.TrailingIcon>
					</FilterChip>
				</DropdownMenu.Trigger>
				<DropdownMenu.Items>
					{options.map((option) => (
						<DropdownMenuItem
							key={option.key}
							onClick={() => {
								option.onSelect()
								if (!multiple) {
									close()
								}
							}}
						>
							<DropdownMenuItem.Text>
								<Text>{option.label}</Text>
							</DropdownMenuItem.Text>
							<DropdownMenuItem.LeadingIcon>
								{option.checked ? (
									<Icon size={ITEM_ICON_SIZE} source={symbolSource('checkmark')} />
								) : (
									// Keeps every label in line, checked or not.
									<Box modifiers={[size(ITEM_ICON_SIZE, ITEM_ICON_SIZE)]} />
								)}
							</DropdownMenuItem.LeadingIcon>
						</DropdownMenuItem>
					))}
				</DropdownMenu.Items>
			</DropdownMenu>
		</Host>
	)
}
