import * as React from 'react'

/** Where a row sits among its section's rows, which picks its card's corners. */
export type RowPosition = 'only' | 'first' | 'middle' | 'last'

/** How a list draws its rows. */
export type RowStyle = 'grouped' | 'plain'

/**
 * A slot for one list row, provided by `Section` (and by `List` for a row
 * outside any section). The first component of this layer to render inside it
 * draws the row -- a Material list item -- around itself and claims the slot,
 * so nothing nested deeper draws a second one. A button that is the whole row
 * becomes a clickable list item; a stack becomes the item's content.
 */
export type RowSlot = {
	position: RowPosition
	style: RowStyle
	/** Draws a divider under the row: every plain row but a section's last. */
	divider: boolean
	/** Leaves a gap above the row, for a row standing alone outside any section. */
	spaced?: boolean
	/** The `listRowBackground` its section set for every row in it. */
	background?: unknown
}

/** The row slot the current view may claim, or null once one has. */
export const RowSlotContext = React.createContext<RowSlot | null>(null)

/** Renders children with the row slot claimed, so none of them draws another row. */
export function Claimed({children}: {children?: React.ReactNode}): React.ReactNode {
	return React.createElement(RowSlotContext.Provider, {value: null}, children)
}

/**
 * A list that owns its rows' selection, as SwiftUI's `List(selection:)` does:
 * a row tagged with a value toggles it when tapped and shows a check.
 */
export type ListSelection = {
	selection: readonly (string | number)[]
	onSelectionChange: (selection: (string | number)[]) => void
}

/** The selecting list around the current row, if any. */
export const ListSelectionContext = React.createContext<ListSelection | null>(null)

/** Whether the current view is inside a `List`/`Form`, and how it draws rows. */
export const ListStyleContext = React.createContext<RowStyle | null>(null)

/**
 * Inside a menu's items: buttons, toggles and pickers draw as menu items, and
 * choosing one closes the menu unless `menuActionDismissBehavior('disabled')`
 * asks for it to stay.
 */
export type MenuScope = {close: () => void; index: number}

/** The menu whose items are being drawn, if any. */
export const MenuContext = React.createContext<MenuScope | null>(null)

/**
 * Inside a context menu's trigger: a long press opens the menu. A button in
 * the trigger takes the long press itself, since its own click would
 * otherwise swallow it.
 */
export const LongPressContext = React.createContext<(() => void) | null>(null)
