import {describe, expect, it} from '@jest/globals'
import type {MessStory} from '../../types'
import {leadStory, sectionStories, shelvesOf} from '../shelves'
import {MESSENGER} from '../../../../campuses/edu-stolaf/paper'

const PHOTO = {url: 'https://olafmessenger.com/photo.jpg', width: 1200, height: 800, caption: ''}

/** A story in a section, newest first by its id; `extra` sets a photo, a flag or a column. */
function story(id: number, section: string | null, extra: Partial<MessStory> = {}): MessStory {
	return {
		id,
		title: `Story ${id}`,
		excerpt: '',
		link: `https://olafmessenger.com/${id}/`,
		published: '2026-04-29T22:00:00.000Z',
		section,
		column: null,
		featured: false,
		bylines: [],
		photo: null,
		blocks: [],
		layout: {kind: 'article'},
		...extra,
	}
}

const ids = (stories: MessStory[] | undefined) => stories?.map((s) => s.id)

describe('leadStory', () => {
	it('leads with the newest featured story, even an older one without a photo', () => {
		let stories = [
			story(3, 'Opinions', {photo: PHOTO}),
			story(2, 'News', {photo: PHOTO}),
			story(1, 'Sports', {featured: true}),
		]
		expect(leadStory(stories)?.id).toBe(1)
	})

	it('leads with the newest News story that has a photo when none is featured', () => {
		let stories = [
			story(3, 'Opinions', {photo: PHOTO}),
			story(2, 'News'),
			story(1, 'News', {photo: PHOTO}),
		]
		expect(leadStory(stories)?.id).toBe(1)
	})

	it('leads with the newest story when nothing is featured and no News story has a photo', () => {
		expect(leadStory([story(3, 'Sports'), story(2, 'News')])?.id).toBe(3)
	})

	it('reads a light post, whose photo is a media id', () => {
		let posts = [
			{id: 2, featured: false, section: 'News', photo: null},
			{id: 1, featured: false, section: 'News', photo: 36902},
		]
		expect(leadStory(posts)?.id).toBe(1)
	})

	it('has no lead for no stories', () => {
		expect(leadStory([])).toBeUndefined()
	})
})

describe('shelvesOf', () => {
	it('shelves each section in print order, newest first, and the rest last under More', () => {
		let stories = [
			story(9, 'Variety'),
			story(8, 'Special Edition'),
			story(7, 'Sports'),
			story(6, 'Arts & Entertainment'),
			story(5, 'Opinions'),
			story(4, 'News'),
			story(3, null),
			story(2, 'News'),
		]
		let shelves = shelvesOf(stories, undefined, MESSENGER.mainSections)
		expect(shelves.map((shelf) => shelf.section)).toStrictEqual([
			'News',
			'Opinions',
			'Arts & Entertainment',
			'Sports',
			'Variety',
			null,
		])
		expect(ids(shelves[0]?.stories)).toStrictEqual([4, 2])
		expect(ids(shelves.at(-1)?.stories)).toStrictEqual([8, 3])
	})

	it('leaves the lead story off its shelf', () => {
		let shelves = shelvesOf([story(3, 'News'), story(2, 'News')], 3, MESSENGER.mainSections)
		expect(ids(shelves[0]?.stories)).toStrictEqual([2])
	})

	it('gives an empty section no shelf, and drops a shelf the lead emptied', () => {
		let shelves = shelvesOf([story(3, 'News'), story(2, 'Sports')], 3, MESSENGER.mainSections)
		expect(shelves.map((shelf) => shelf.section)).toStrictEqual(['Sports'])
	})

	it('has no More shelf when every story has a print section', () => {
		expect(
			shelvesOf([story(1, 'News')], undefined, MESSENGER.mainSections).map(
				(shelf) => shelf.section,
			),
		).toStrictEqual(['News'])
	})
})

describe('sectionStories', () => {
	it("holds every story in the section, newest first, the issue's lead among them", () => {
		let stories = [story(4, 'News'), story(3, 'Opinions'), story(2, 'News'), story(1, 'News')]
		// The lead is whichever story the page leads with; the list is not told which, and keeps it.
		expect(ids(sectionStories(stories, 'News'))).toStrictEqual([4, 2, 1])
	})

	it('holds nothing for a section the issue has no stories in', () => {
		expect(sectionStories([story(1, 'News')], 'Sports')).toStrictEqual([])
	})
})
