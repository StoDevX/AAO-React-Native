import {placeTiles} from '../place-tiles'

describe('placeTiles', () => {
	it('puts departments before offices, from either campus shape', () => {
		expect(
			placeTiles({
				departments: [{label: 'Biology', href: 'https://wp.stolaf.edu/biology/'}],
				offices: ['Alumni Relations <https://apps.carleton.edu/alumni/relations/>'],
			}),
		).toEqual([
			{kind: 'department', label: 'Biology', href: 'https://wp.stolaf.edu/biology/'},
			{
				kind: 'office',
				label: 'Alumni Relations',
				href: 'https://apps.carleton.edu/alumni/relations/',
			},
		])
	})

	it('keeps a tile with no link, without one', () => {
		expect(placeTiles({departments: ['Chemistry'], offices: []})).toEqual([
			{kind: 'department', label: 'Chemistry', href: null},
		])
	})

	// The feed is not validated at the boundary, so a record can omit either
	// field entirely.
	it('copes with fields the feed left out', () => {
		expect(placeTiles({departments: undefined, offices: undefined} as never)).toEqual([])
	})
})
