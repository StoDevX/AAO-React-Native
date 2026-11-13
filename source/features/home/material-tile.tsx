import type * as React from 'react'

import type {HomeTileStyle} from './store'
import type {ViewType} from '../views'

type Props = {
	view: ViewType
	index: number
	tileStyle: HomeTileStyle
	onPress: () => void
}

/**
 * Home's Material 3 tile, which only Android draws (`material-tile.android.tsx`).
 * iOS draws its gradient cards, `HomeScreenButton`, and never this.
 */
export function MaterialHomeTile(_props: Props): React.ReactNode {
	return null
}
