import * as React from 'react'
import {GradientTile} from '../../components/gradient-tile'
import type {CategoryTileData} from './categories'

type Props = {
	tile: CategoryTileData
	/** Opens this category's filtered org list. */
	onPress: () => void
}

/**
 * A category tile for the Student Orgs landing screen. Tapping opens
 * that category's filtered org list.
 */
export function CategoryTile({tile, onPress}: Props): React.ReactNode {
	return (
		<GradientTile
			gradient={tile.gradient}
			icon={tile.icon}
			onPress={onPress}
			ratio={1}
			title={tile.name}
		/>
	)
}
