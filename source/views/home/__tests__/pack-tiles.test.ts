import {describe, it, expect} from '@jest/globals'
import {packTiles} from '../pack-tiles'
import type {TileSize} from '../types'
import type {ViewType} from '../../views'

const v = (id: string): ViewType =>
	({
		id,
		type: 'view',
		view: 'Home',
		title: id,
		icon: 'home',
		foreground: 'light',
		tint: '#000',
	}) as ViewType

const fixedSize = (size: TileSize) => () => size
const sizeMap = (sizes: Record<string, TileSize>) => (view: ViewType) =>
	sizes[(view as unknown as {id: string}).id] ?? '1x2'

describe('packTiles', () => {
	it('returns empty array for no views', () => {
		expect(packTiles([], fixedSize('1x2'))).toEqual([])
	})

	it('packs all-1x2 tiles into the same two-column layout as today', () => {
		const views = [v('a'), v('b'), v('c'), v('d'), v('e')]
		const packed = packTiles(views, fixedSize('1x2'))
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 2],
			[2, 0],
		])
	})

	it('places a single 2x4 spanning the full row at (0,0)', () => {
		const packed = packTiles([v('wide')], fixedSize('2x4'))
		expect(packed[0]).toMatchObject({row: 0, col: 0, size: '2x4'})
	})

	it('packs mixed [1x2, 1x2, 2x2, 1x1, 1x2] with the 2x2 reservation respected', () => {
		const views = [v('a'), v('b'), v('c'), v('d'), v('e')]
		const sizes = sizeMap({a: '1x2', b: '1x2', c: '2x2', d: '1x1', e: '1x2'})
		const packed = packTiles(views, sizes)
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 2],
			[2, 2],
		])
	})

	it('reserves columns of a 2x2 across both rows so subsequent tiles flow around it', () => {
		const views = [v('a'), v('b'), v('c'), v('d')]
		const sizes = sizeMap({a: '2x2', b: '1x2', c: '1x2', d: '1x2'})
		const packed = packTiles(views, sizes)
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 2],
			[2, 0],
		])
	})

	it('drops a 2x4 to a new row when it cannot fit in remaining cols', () => {
		const views = [v('small'), v('wide')]
		const sizes = sizeMap({small: '1x1', wide: '2x4'})
		const packed = packTiles(views, sizes)
		expect(packed[0]).toMatchObject({row: 0, col: 0})
		expect(packed[1]).toMatchObject({row: 1, col: 0})
	})

	it('wraps a 2x4 to the next row when the cursor sits past col 0', () => {
		const views = [v('a'), v('b'), v('c')]
		const sizes = sizeMap({a: '1x2', b: '1x2', c: '2x4'})
		const packed = packTiles(views, sizes)
		expect(packed.map((p) => [p.row, p.col])).toEqual([
			[0, 0],
			[0, 2],
			[1, 0],
		])
	})
})
