import type * as React from 'react'

import type {MapCredit} from './urls'
import type {MapGroupLabel} from '../telemetry/catalog'

export type MapTopBarProps = {
	query: string
	onQueryChange: (text: string) => void
	/** The field gained or lost focus; `hasText` is whether it holds a query. */
	onSearchFocusChange: (focused: boolean, hasText: boolean) => void
	groups: readonly MapGroupLabel[]
	opened: MapGroupLabel | null
	onOpen: (label: MapGroupLabel | null) => void
	credits: readonly MapCredit[]
	onOpenCredit: (credit: MapCredit) => void
	onBack: () => void
}

/**
 * The search bar and category chips floating over Android's map. iOS keeps
 * its search in the sheet and its categories in the sheet's grid, as Apple
 * Maps does, so it draws nothing here.
 */
export function MapTopBar(_props: MapTopBarProps): React.ReactNode {
	return null
}
