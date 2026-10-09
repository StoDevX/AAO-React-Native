import {
	favoriteNamesForCampus,
	isFavoriteBuilding,
	reducer,
	State,
	toggleFavoriteBuilding,
} from '../parts/buildings'
import {describe, it, expect} from '@jest/globals'

describe('toggle favorite building hours', () => {
	it('should return the initial state', () => {
		const {favorites} = reducer(undefined, {type: '@@INIT'})
		expect(favorites).toEqual([])
	})

	it('should handle a favorite being added to an empty list', () => {
		const previousState: State = {favorites: []}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'edu.stolaf', name: 'a'}),
		)
		expect(favorites).toEqual([{campus: 'edu.stolaf', name: 'a'}])
	})

	it('should handle a favorite being added to an existing list', () => {
		const previousState: State = {
			favorites: [
				{campus: 'edu.stolaf', name: 'a'},
				{campus: 'edu.stolaf', name: 'b'},
			],
		}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'edu.stolaf', name: 'c'}),
		)
		expect(favorites).toEqual([
			{campus: 'edu.stolaf', name: 'a'},
			{campus: 'edu.stolaf', name: 'b'},
			{campus: 'edu.stolaf', name: 'c'},
		])
	})

	it('should handle a favorite being removed from an existing list', () => {
		const previousState: State = {favorites: [{campus: 'edu.stolaf', name: 'a'}]}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'edu.stolaf', name: 'a'}),
		)
		expect(favorites).toEqual([])
	})

	it('should handle a favorite being removed from an existing list of multiple favorites', () => {
		const previousState: State = {
			favorites: [
				{campus: 'edu.stolaf', name: 'a'},
				{campus: 'edu.stolaf', name: 'b'},
			],
		}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'edu.stolaf', name: 'a'}),
		)
		expect(favorites).toEqual([{campus: 'edu.stolaf', name: 'b'}])
	})

	// CRITICAL: this is the whole point of keying favourites by campus AND
	// name -- St. Olaf and Carleton both have a "Bookstore", and favouriting
	// one must never favourite, or unfavourite, the other.
	it('favourites the same name on two campuses independently', () => {
		const previousState: State = {favorites: []}

		let afterStolaf = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'edu.stolaf', name: 'Bookstore'}),
		)
		expect(afterStolaf.favorites).toEqual([{campus: 'edu.stolaf', name: 'Bookstore'}])

		let afterCarleton = reducer(
			afterStolaf,
			toggleFavoriteBuilding({campus: 'edu.carleton', name: 'Bookstore'}),
		)
		expect(afterCarleton.favorites).toEqual(
			expect.arrayContaining([
				{campus: 'edu.stolaf', name: 'Bookstore'},
				{campus: 'edu.carleton', name: 'Bookstore'},
			]),
		)

		// Unfavouriting St. Olaf's Bookstore must leave Carleton's favourited.
		let afterUnfavoritingStolaf = reducer(
			afterCarleton,
			toggleFavoriteBuilding({campus: 'edu.stolaf', name: 'Bookstore'}),
		)
		expect(afterUnfavoritingStolaf.favorites).toEqual([{campus: 'edu.carleton', name: 'Bookstore'}])
	})
})

describe('isFavoriteBuilding', () => {
	it('tells campuses apart for the same name', () => {
		const favorites = [{campus: 'edu.stolaf' as const, name: 'Bookstore'}]

		expect(isFavoriteBuilding(favorites, 'edu.stolaf', 'Bookstore')).toBe(true)
		expect(isFavoriteBuilding(favorites, 'edu.carleton', 'Bookstore')).toBe(false)
	})
})

describe('favoriteNamesForCampus', () => {
	const favorites = [
		{campus: 'edu.stolaf' as const, name: 'Bookstore'},
		{campus: 'edu.carleton' as const, name: 'Sayles'},
		{campus: 'edu.stolaf' as const, name: 'Rolvaag'},
	]

	it('keeps only the named campus, in the order given', () => {
		expect(favoriteNamesForCampus(favorites, 'edu.stolaf')).toEqual(['Bookstore', 'Rolvaag'])
	})

	it('does not leak a name favourited on the other campus', () => {
		// `Bookstore` exists on both campuses; only St. Olaf's is favourited.
		expect(favoriteNamesForCampus(favorites, 'edu.carleton')).toEqual(['Sayles'])
	})

	it('is empty when nothing is favourited on that campus', () => {
		expect(favoriteNamesForCampus([], 'edu.stolaf')).toEqual([])
	})
})
