import {reducer, State, toggleFavoriteBuilding} from '../parts/buildings'
import {describe, it, expect} from '@jest/globals'

describe('toggle favorite building hours', () => {
	it('should return the initial state', () => {
		const {favorites} = reducer(undefined, {type: undefined})
		expect(favorites).toEqual([])
	})

	it('should handle a favorite being added to an empty list', () => {
		const previousState: State = {favorites: []}
		const {favorites} = reducer(previousState, toggleFavoriteBuilding('a'))
		expect(favorites).toEqual(['a'])
	})

	it('should handle a favorite being added to an existing list', () => {
		const previousState: State = {favorites: ['a', 'b']}
		const {favorites} = reducer(previousState, toggleFavoriteBuilding('c'))
		expect(favorites).toEqual(['a', 'b', 'c'])
	})

	it('should handle a favorite being removed from an existing list', () => {
		const previousState: State = {favorites: ['a']}
		const {favorites} = reducer(previousState, toggleFavoriteBuilding('a'))
		expect(favorites).toEqual([])
	})

	it('should handle a favorite being removed from an existing list of multiple favorites', () => {
		const previousState: State = {favorites: ['a', 'b']}
		const {favorites} = reducer(previousState, toggleFavoriteBuilding('a'))
		expect(favorites).toEqual(['b'])
	})
})
