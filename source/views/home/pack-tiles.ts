import type {ViewType} from '../views'
import {GRID_COLUMNS, TILE_DIMENSIONS, type TileSize} from './types'

export type PackedTile = {
	view: ViewType
	size: TileSize
	row: number
	col: number
}

export function packTiles(
	views: ViewType[],
	sizeOf: (view: ViewType) => TileSize,
): PackedTile[] {
	const result: PackedTile[] = []
	const occupied = new Set<string>()

	const cellKey = (r: number, c: number) => `${r},${c}`
	const isOccupied = (r: number, c: number) => occupied.has(cellKey(r, c))
	const occupy = (r: number, c: number) => occupied.add(cellKey(r, c))

	const fits = (r: number, c: number, rows: number, cols: number) => {
		if (c + cols > GRID_COLUMNS) return false
		for (let dr = 0; dr < rows; dr++) {
			for (let dc = 0; dc < cols; dc++) {
				if (isOccupied(r + dr, c + dc)) return false
			}
		}
		return true
	}

	let row = 0
	let col = 0

	for (const view of views) {
		const size = sizeOf(view)
		const {rows, cols} = TILE_DIMENSIONS[size]

		while (!fits(row, col, rows, cols)) {
			col += 1
			if (col >= GRID_COLUMNS) {
				col = 0
				row += 1
			}
		}

		result.push({view, size, row, col})
		for (let dr = 0; dr < rows; dr++) {
			for (let dc = 0; dc < cols; dc++) {
				occupy(row + dr, col + dc)
			}
		}

		col += cols
		if (col >= GRID_COLUMNS) {
			col = 0
			row += 1
		}
	}

	return result
}
