import {describe, expect, test} from '@jest/globals'

import {VALLEY_ECHO} from '../../../campuses/example-college/paper'
import type {CampusRecordingFile} from '../../campus/fixtures'
import exampleCollege from '../../campus/__fixtures__/example.college'
import {filterTree} from '../lib/filter'
import {groupIssues, ISSUE_PAGE_SIZE, parseLightPosts} from '../lib/issues'
import {parseMessCategories, parseMessPosts} from '../lib/posts'
import type {MessStory} from '../types'

const WP = 'https://echo.college.example/wp-json/wp/v2'
const files = exampleCollege as ReadonlyArray<CampusRecordingFile>

/** The Echo's answer to `path`, failing the test when it has none. */
function answer(path: string): unknown {
	let file = files.find((each) => each.key === `GET ${WP}/${path}`)
	if (!file) throw new Error(`no fixture for ${path}`)
	return file.json
}

const categories = parseMessCategories(answer('categories?per_page=100&_fields=id,name,parent'))
/** The stories at `path`; a single post comes back as an object rather than a list. */
const stories = (path: string): MessStory[] => {
	let body = answer(path)
	return parseMessPosts(Array.isArray(body) ? body : [body], categories, VALLEY_ECHO)
}
const indexPage = (page: number) =>
	parseLightPosts(
		answer(
			`posts?per_page=${ISSUE_PAGE_SIZE}&page=${page}&_fields=id,date,title,categories,featured_media`,
		),
		categories,
		VALLEY_ECHO,
	)
const columnId = (name: string): number => {
	let column = categories.find((each) => each.name === name)
	if (!column) throw new Error(`no ${name} category`)
	return column.id
}
const column = (name: string) =>
	stories(`posts?categories=${columnId(name)}&per_page=30&_embed=true`)

/**
 * The News UI tests read The Valley Echo through the app, where a wrong answer shows up as a
 * screen that does not have what a test looks for. These say what the fixtures have to keep
 * being true for those tests to mean anything, so an edit that breaks one fails here instead.
 */
describe("The Valley Echo's fixtures", () => {
	test('Variety is a section, with the Comic, Horoscopes and Photo columns', () => {
		let variety = filterTree(categories, VALLEY_ECHO.mainSections).find(
			(branch) => branch.section.name === 'Variety',
		)
		expect(variety?.columns.map((each) => each.name)).toEqual(['Comic', 'Horoscopes', 'Photo'])
	})

	test("the issue list's first page is all 2026, so 2025 needs the next page", () => {
		let first = groupIssues(indexPage(1), true)
		expect(first.every((issue) => issue.day.startsWith('2026'))).toBe(true)
		let both = groupIssues([...indexPage(1), ...indexPage(2)], false)
		expect(both.some((issue) => issue.day.startsWith('2025'))).toBe(true)
		expect(indexPage(2).length).toBeLessThan(ISSUE_PAGE_SIZE)
	})

	test('the newest issue leads with News and shelves another, and the special edition is second', () => {
		let [newest, second] = groupIssues(indexPage(1), true)
		expect(newest?.isSpecial).toBe(false)
		expect(second?.isSpecial).toBe(true)
		let issue = stories(`posts?include=${newest?.storyIds.join(',')}&per_page=100&_embed=true`)
		expect(issue.find((story) => story.id === newest?.leadId)?.section).toBe('News')
		expect(issue.filter((story) => story.section === 'News').length).toBeGreaterThan(1)
		let special = stories(`posts?include=${second?.storyIds.join(',')}&per_page=100&_embed=true`)
		// Every story in no print section, for the More grid: the lead and at least two more.
		expect(special.every((story) => !VALLEY_ECHO.mainSections.includes(story.section ?? ''))).toBe(
			true,
		)
		expect(special.length).toBeGreaterThanOrEqual(3)
	})

	test('every Horoscopes story reads as twelve signs', () => {
		let horoscopes = column('Horoscopes')
		expect(horoscopes.length).toBeGreaterThan(0)
		expect(horoscopes.map((story) => story.layout.kind)).toEqual(horoscopes.map(() => 'horoscopes'))
	})

	test('the newest comic draws its picture, with two more of its series to read next', () => {
		let [newest, ...rest] = column('Comic')
		expect(newest?.layout.kind).toBe('image')
		expect(newest?.photo?.url).toMatch(/^data:image\/png;base64,/u)
		expect(
			rest.filter((story) => story.title.startsWith('Monkey Business:')).length,
		).toBeGreaterThanOrEqual(2)
	})

	test('the newest Photo story is a Variety › Photo feature', () => {
		let [newest] = column('Photo')
		expect(newest?.section).toBe('Variety')
		expect(newest?.column).toBe('Photo')
		expect(newest?.layout.kind).toBe('feature')
	})

	test('each Variety story opens on its own', () => {
		for (let story of stories(`posts?categories=${columnId('Variety')}&per_page=30&_embed=true`)) {
			expect(stories(`posts/${story.id}?_embed=true`)[0]?.title).toBe(story.title)
		}
	})
})
