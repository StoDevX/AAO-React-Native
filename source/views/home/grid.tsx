import React from 'react'
import {StyleSheet, View, useWindowDimensions} from 'react-native'

import type {ViewType} from '../views'
import {CELL_MARGIN} from './button'
import {packTiles, type PackedTile} from './pack-tiles'
import {
	GRID_COLUMNS,
	TILE_DIMENSIONS,
	UNIT_HEIGHT,
	type TileSize,
} from './types'

type Props = {
	views: ViewType[]
	sizeOf: (view: ViewType) => TileSize
	renderTile: (packed: PackedTile) => React.ReactElement
}

export function HomeScreenGrid({
	views,
	sizeOf,
	renderTile,
}: Props): React.ReactElement {
	const {width: screenWidth} = useWindowDimensions()

	const horizontalPadding = CELL_MARGIN / 2
	const usableWidth = screenWidth - horizontalPadding * 2
	const unitWidth = usableWidth / GRID_COLUMNS

	const packed = React.useMemo(() => packTiles(views, sizeOf), [views, sizeOf])

	const maxRowEnd = packed.reduce((acc, p) => {
		const {rows} = TILE_DIMENSIONS[p.size]
		return Math.max(acc, p.row + rows)
	}, 0)

	const containerHeight = maxRowEnd * UNIT_HEIGHT

	return (
		<View
			style={[
				styles.container,
				{
					height: containerHeight,
					marginHorizontal: horizontalPadding,
					marginTop: CELL_MARGIN,
				},
			]}
		>
			{packed.map((p) => {
				const {rows, cols} = TILE_DIMENSIONS[p.size]
				const left = p.col * unitWidth
				const top = p.row * UNIT_HEIGHT
				const width = cols * unitWidth
				const height = rows * UNIT_HEIGHT
				return (
					<View
						key={p.view.id}
						style={[styles.cell, {left, top, width, height}]}
					>
						{renderTile(p)}
					</View>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
	},
	cell: {
		position: 'absolute',
	},
})
