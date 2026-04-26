import {describe, it, expect} from '@jest/globals'
import {
	reducer,
	resetHomescreenSizes,
	selectHomescreenSize,
	setHomescreenTileSize,
	type State,
} from '../parts/settings'
import {DEFAULT_TILE_SIZE} from '../../views/home/types'
import type {RootState} from '../store'

const baseState: State = {
	unofficialityAcknowledged: false,
	devModeOverride: false,
	homescreenSizes: {},
}

const wrapState = (settings: State): RootState =>
	({settings}) as unknown as RootState

describe('settings slice — homescreen sizes', () => {
	it('initial state has an empty homescreenSizes map', () => {
		const next = reducer(undefined, {type: '@@INIT'})
		expect(next.homescreenSizes).toEqual({})
	})

	it('setHomescreenTileSize writes the size keyed by id', () => {
		const next = reducer(
			baseState,
			setHomescreenTileSize({id: 'menus', size: '2x2'}),
		)
		expect(next.homescreenSizes).toEqual({menus: '2x2'})
	})

	it('setHomescreenTileSize overwrites an existing size for the same id', () => {
		const initial: State = {
			...baseState,
			homescreenSizes: {menus: '1x1'},
		}
		const next = reducer(
			initial,
			setHomescreenTileSize({id: 'menus', size: '2x4'}),
		)
		expect(next.homescreenSizes).toEqual({menus: '2x4'})
	})

	it('resetHomescreenSizes clears the map', () => {
		const initial: State = {
			...baseState,
			homescreenSizes: {menus: '2x2', sis: '1x1'},
		}
		const next = reducer(initial, resetHomescreenSizes())
		expect(next.homescreenSizes).toEqual({})
	})

	it('selectHomescreenSize returns the stored size when present', () => {
		const state = wrapState({...baseState, homescreenSizes: {menus: '2x2'}})
		expect(selectHomescreenSize('menus')(state)).toBe('2x2')
	})

	it('selectHomescreenSize returns DEFAULT_TILE_SIZE for an unknown id', () => {
		const state = wrapState(baseState)
		expect(selectHomescreenSize('not-a-real-id')(state)).toBe(DEFAULT_TILE_SIZE)
	})
})
