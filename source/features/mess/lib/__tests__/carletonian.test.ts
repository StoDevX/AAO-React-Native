import {describe, expect, test} from '@jest/globals'

import {CARLETONIAN} from '../../../../campuses/edu-carleton/paper'
import {viewOf} from '../front-view'
import {placement} from '../posts'
import {shelvesOf} from '../shelves'
import type {MessCategory, MessStory} from '../../types'

/** The Carletonian's category tree, as its site lists it. */
const CATEGORIES: MessCategory[] = [
	{id: 1, name: 'Uncategorized', parent: 0},
	{id: 6, name: 'Viewpoint', parent: 0},
	{id: 7, name: 'News', parent: 0},
	{id: 8, name: 'Sports', parent: 7},
	{id: 38, name: 'Features and Arts', parent: 0},
	{id: 41, name: 'The Bald Spot', parent: 0},
	{id: 43, name: 'Arb Notes', parent: 0},
	{id: 46, name: 'Comics', parent: 41},
]

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))
const sections = CARLETONIAN.mainSections

describe("the Carletonian's sections", () => {
	test('places a Sports story in News, under its Sports column', () => {
		expect(placement([8], byId, sections)).toEqual({
			section: 'News',
			column: 'Sports',
			featured: false,
		})
	})

	test('places a comic in The Bald Spot, under Comics', () => {
		expect(placement([46], byId, sections)).toMatchObject({
			section: 'The Bald Spot',
			column: 'Comics',
		})
	})

	test('keeps a view narrowed to one of its own sections', () => {
		expect(viewOf('Latest:Viewpoint', sections)).toEqual({mode: 'latest', section: 'Viewpoint'})
	})

	test("does not keep a view narrowed to one of the Messenger's", () => {
		expect(viewOf('Latest:Variety', sections)).toEqual({mode: 'issues', section: null})
	})

	test('shelves an issue by its own sections, in its order', () => {
		let story = (id: number, section: string) => ({id, section}) as MessStory
		let shelves = shelvesOf(
			[story(1, 'Viewpoint'), story(2, 'News'), story(3, 'The Bald Spot')],
			undefined,
			sections,
		)
		expect(shelves.map((shelf) => shelf.section)).toEqual(['News', 'Viewpoint', 'The Bald Spot'])
	})
})
