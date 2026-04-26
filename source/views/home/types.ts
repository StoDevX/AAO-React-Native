export type TileSize = '1x1' | '1x2' | '2x2' | '2x4'

export const TILE_SIZES: readonly TileSize[] = ['1x1', '1x2', '2x2', '2x4']

export const DEFAULT_TILE_SIZE: TileSize = '1x2'

export const TILE_DIMENSIONS: Record<TileSize, {rows: 1 | 2; cols: 1 | 2 | 4}> =
	{
		'1x1': {rows: 1, cols: 1},
		'1x2': {rows: 1, cols: 2},
		'2x2': {rows: 2, cols: 2},
		'2x4': {rows: 2, cols: 4},
	}

export const GRID_COLUMNS = 4

export const UNIT_HEIGHT = 80
