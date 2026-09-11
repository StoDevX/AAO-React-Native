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
			toggleFavoriteBuilding({campus: 'stolaf', name: 'a'}),
		)
		expect(favorites).toEqual([{campus: 'stolaf', name: 'a'}])
	})

	it('should handle a favorite being added to an existing list', () => {
		const previousState: State = {
			favorites: [
				{campus: 'stolaf', name: 'a'},
				{campus: 'stolaf', name: 'b'},
			],
		}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'stolaf', name: 'c'}),
		)
		expect(favorites).toEqual([
			{campus: 'stolaf', name: 'a'},
			{campus: 'stolaf', name: 'b'},
			{campus: 'stolaf', name: 'c'},
		])
	})

	it('should handle a favorite being removed from an existing list', () => {
		const previousState: State = {favorites: [{campus: 'stolaf', name: 'a'}]}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'stolaf', name: 'a'}),
		)
		expect(favorites).toEqual([])
	})

	it('should handle a favorite being removed from an existing list of multiple favorites', () => {
		const previousState: State = {
			favorites: [
				{campus: 'stolaf', name: 'a'},
				{campus: 'stolaf', name: 'b'},
			],
		}
		const {favorites} = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'stolaf', name: 'a'}),
		)
		expect(favorites).toEqual([{campus: 'stolaf', name: 'b'}])
	})

	// CRITICAL: this is the whole point of keying favourites by campus AND
	// name -- St. Olaf and Carleton both have a "Bookstore", and favouriting
	// one must never favourite, or unfavourite, the other.
	it('favourites the same name on two campuses independently', () => {
		const previousState: State = {favorites: []}

		let afterStolaf = reducer(
			previousState,
			toggleFavoriteBuilding({campus: 'stolaf', name: 'Bookstore'}),
		)
		expect(afterStolaf.favorites).toEqual([{campus: 'stolaf', name: 'Bookstore'}])

		let afterCarleton = reducer(
			afterStolaf,
			toggleFavoriteBuilding({campus: 'carleton', name: 'Bookstore'}),
		)
		expect(afterCarleton.favorites).toEqual(
			expect.arrayContaining([
				{campus: 'stolaf', name: 'Bookstore'},
				{campus: 'carleton', name: 'Bookstore'},
			]),
		)

		// Unfavouriting St. Olaf's Bookstore must leave Carleton's favourited.
		let afterUnfavoritingStolaf = reducer(
			afterCarleton,
			toggleFavoriteBuilding({campus: 'stolaf', name: 'Bookstore'}),
		)
		expect(afterUnfavoritingStolaf.favorites).toEqual([{campus: 'carleton', name: 'Bookstore'}])
	})
})

describe('isFavoriteBuilding', () => {
	it('tells campuses apart for the same name', () => {
		const favorites = [{campus: 'stolaf' as const, name: 'Bookstore'}]

		expect(isFavoriteBuilding(favorites, 'stolaf', 'Bookstore')).toBe(true)
		expect(isFavoriteBuilding(favorites, 'carleton', 'Bookstore')).toBe(false)
	})
})

describe('favoriteNamesForCampus', () => {
	const favorites = [
		{campus: 'stolaf' as const, name: 'Bookstore'},
		{campus: 'carleton' as const, name: 'Sayles'},
		{campus: 'stolaf' as const, name: 'Rolvaag'},
	]

	it('keeps only the named campus, in the order given', () => {
		expect(favoriteNamesForCampus(favorites, 'stolaf')).toEqual(['Bookstore', 'Rolvaag'])
	})

	it('does not leak a name favourited on the other campus', () => {
		// `Bookstore` exists on both campuses; only St. Olaf's is favourited.
		expect(favoriteNamesForCampus(favorites, 'carleton')).toEqual(['Sayles'])
	})

	it('is empty when nothing is favourited on that campus', () => {
		expect(favoriteNamesForCampus([], 'stolaf')).toEqual([])
	})
})
