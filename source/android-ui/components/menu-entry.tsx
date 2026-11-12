import * as React from 'react'

import {Box, DropdownMenuItem, Text as ComposeText} from '@expo/ui/jetpack-compose'
import {size} from '@expo/ui/jetpack-compose/modifiers'

import {usePalette} from '../colors'
import {MenuContext} from '../context'
import {EnvironmentContext} from '../modifiers'
import {SymbolIcon} from './image'

/** One item of a Material dropdown menu. */
type MenuEntryProps = {
	label: string
	onPress?: () => void
	/** An SF Symbol name, drawn as the item's leading icon. */
	systemImage?: string
	/** Draws a check before the label; `false` keeps the check's space empty. */
	checked?: boolean
	destructive?: boolean
	/** A trailing glyph, for an item that opens a submenu. */
	trailingSymbol?: string
}

/**
 * A SwiftUI menu action as a Material `DropdownMenuItem`. Choosing it runs
 * the action and closes the menu, unless a `menuActionDismissBehavior
 * ('disabled')` above it asks the menu to stay open, as the filter menus do.
 */
export function MenuEntry({
	label,
	onPress,
	systemImage,
	checked,
	destructive = false,
	trailingSymbol,
}: MenuEntryProps): React.ReactNode {
	let menu = React.useContext(MenuContext)
	let env = React.useContext(EnvironmentContext)
	let palette = usePalette()
	let enabled = env.disabled !== true && onPress !== undefined
	let leading: React.ReactNode = null
	if (checked !== undefined) {
		leading = checked ? (
			<SymbolIcon name="checkmark" size={24} />
		) : (
			<Box modifiers={[size(24, 24)]} />
		)
	} else if (systemImage) {
		leading = <SymbolIcon name={systemImage} size={24} />
	}
	return (
		<DropdownMenuItem
			elementColors={
				destructive
					? {textColor: palette.colors.error, leadingIconColor: palette.colors.error}
					: undefined
			}
			enabled={enabled}
			onClick={() => {
				onPress?.()
				if (!env.menuStaysOpen && !trailingSymbol) {
					menu?.close()
				}
			}}
		>
			<DropdownMenuItem.Text>
				<ComposeText>{label}</ComposeText>
			</DropdownMenuItem.Text>
			{leading ? <DropdownMenuItem.LeadingIcon>{leading}</DropdownMenuItem.LeadingIcon> : null}
			{trailingSymbol ? (
				<DropdownMenuItem.TrailingIcon>
					<SymbolIcon name={trailingSymbol} size={24} />
				</DropdownMenuItem.TrailingIcon>
			) : null}
		</DropdownMenuItem>
	)
}
