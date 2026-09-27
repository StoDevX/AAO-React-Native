import {describe, expect, it} from '@jest/globals'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import springPosts from '../../__tests__/fixtures/issue-posts.json'
import type {MessIssue} from '../../types'
import {
	datelineText,
	groupIssues,
	issueDate,
	issueName,
	parseLightPosts,
	parseMediaUrls,
	withPhotoUrls,
} from '../issues'
import {parseMessCategories} from '../posts'

const categories = parseMessCategories(categoriesJson)
/** This spring's posts, Feb 18 to May 12, newest first. */
const spring = parseLightPosts(springPosts, categories)

/** Each issue as its day and how many posts it holds. */
const outline = (issues: MessIssue[]) => issues.map((issue) => [issue.day, issue.count])

const issueOn = (day: string) => groupIssues(spring, false).find((issue) => issue.day === day)

describe('parseLightPosts', () => {
	it("reads a post's day as the paper dated it, with its section, flag and photo", () => {
		expect(spring[0]).toStrictEqual({
			id: 36949,
			day: '2026-05-12',
			title: 'Appropriation or fusion: student thoughts on Stav food stall names',
			section: 'Special Edition',
			special: true,
			featured: false,
			// Its featured image is the Mess logo, which is no photo.
			photo: null,
			photoUrl: null,
		})
		expect(spring.find((post) => post.id === 36896)).toStrictEqual({
			id: 36896,
			day: '2026-04-29',
			title: 'St. Olaf awarded 2026-27 Hunger Free Campus grant',
			section: 'News',
			special: false,
			featured: true,
			photo: 36902,
			// Looked up with the rest of its page's photos, after parsing.
			photoUrl: null,
		})
	})

	it('marks a special-edition post filed under a print section too', () => {
		let [post] = parseLightPosts([{...springPosts[0], categories: [7, 1139]}], categories)
		expect(post).toMatchObject({section: 'News', special: true})
	})

	it("decodes a title's entities", () => {
		expect(spring.find((post) => post.id === 36715)?.title).toBe(
			'The Olaf Messenger’s 2026 SGA election voter guide',
		)
	})

	it('skips a malformed post', () => {
		expect(parseLightPosts([{id: 1}, springPosts[0]], categories)).toHaveLength(1)
	})

	it('throws when every post is malformed', () => {
		expect(() => parseLightPosts([{id: 1}], categories)).toThrow('every Mess post was malformed')
	})
})

describe('groupIssues', () => {
	it("finds the spring's eight issues, newest first", () => {
		expect(outline(groupIssues(spring, false))).toStrictEqual([
			['2026-05-12', 11],
			['2026-04-29', 35],
			['2026-03-25', 25],
			['2026-03-18', 31],
			['2026-03-11', 32],
			['2026-03-04', 26],
			['2026-02-25', 30],
			['2026-02-18', 35],
		])
	})

	// WordPress pages by offset, so a post published between two page fetches pushes the last
	// post of one page onto the next as well.
	it('counts a post once when it arrives on two pages', () => {
		let pages = [...spring.slice(0, 100), spring[99], ...spring.slice(100)]
		expect(outline(groupIssues(pages, false))).toStrictEqual(outline(groupIssues(spring, false)))
	})

	it('lists every post of an issue by id, newest first, strays included, each once', () => {
		let pages = [...spring.slice(0, 100), spring[99], ...spring.slice(100)].filter(
			(post) => post !== undefined,
		)
		let issues = groupIssues(pages, false)
		let april = spring.filter((post) => post.day >= '2026-04-29' && post.day < '2026-05-12')
		expect(issues.find((issue) => issue.day === '2026-04-29')?.storyIds).toStrictEqual(
			april.map((post) => post.id),
		)
		// The post that arrived on two pages sits in Mar 18.
		let march = issues.find((issue) => issue.day === '2026-03-18')
		expect(march?.storyIds).toHaveLength(31)
		expect(new Set(march?.storyIds).size).toBe(31)
	})

	it('names an issue special when most of its posts are, whatever sections they sit in', () => {
		let filedUnderNews = spring.map((post) => (post.special ? {...post, section: 'News'} : post))
		expect(groupIssues(filedUnderNews, false)[0]).toMatchObject({
			day: '2026-05-12',
			isSpecial: true,
		})
	})

	it('keeps an issue regular when one of its posts is from a special edition', () => {
		let oneSpecial = spring.map((post) => (post.id === 36896 ? {...post, special: true} : post))
		expect(groupIssues(oneSpecial, false)[1]).toMatchObject({day: '2026-04-29', isSpecial: false})
	})

	it('joins the strays of Mar 23 and 24 to Mar 18, and ends it at the next issue', () => {
		expect(issueOn('2026-03-18')).toMatchObject({
			count: 31,
			after: '2026-03-17T23:59:59',
			before: '2026-03-25T00:00:00',
		})
	})

	it('joins the stray of Mar 26 to Mar 25', () => {
		expect(issueOn('2026-03-25')).toMatchObject({count: 25, before: '2026-04-29T00:00:00'})
	})

	it('joins the stray of May 7 to Apr 29', () => {
		expect(issueOn('2026-04-29')).toMatchObject({count: 35, before: '2026-05-12T00:00:00'})
	})

	it('joins the stray of Mar 1 to Feb 25', () => {
		expect(issueOn('2026-02-25')).toMatchObject({count: 30, before: '2026-03-04T00:00:00'})
	})

	it('runs the newest issue to now', () => {
		expect(issueOn('2026-05-12')).toMatchObject({after: '2026-05-11T23:59:59', before: null})
	})

	it('leaves out a stray older than every issue', () => {
		let fromMarch = spring.filter((post) => post.day >= '2026-03-01')
		expect(groupIssues(fromMarch, false).at(-1)).toMatchObject({day: '2026-03-04', count: 26})
	})

	// Page 1 ends 27 posts into Mar 18, whose other two are on page 2.
	it('holds back the oldest day while another page may hold more of it', () => {
		expect(outline(groupIssues(spring.slice(0, 100), true))).toStrictEqual([
			['2026-05-12', 11],
			['2026-04-29', 35],
			['2026-03-25', 25],
		])
	})

	it("picks each issue's lead from its light fields, with its photo's address", () => {
		let photos = new Map([[36902, 'https://olafmessenger.com/grant.png']])
		let issues = groupIssues(withPhotoUrls(spring, photos), false)
		expect(issues.map((issue) => issue.leadId)).toStrictEqual([
			36949, 36896, 36726, 36715, 36572, 36452, 36361, 36284,
		])
		expect(issues[1]).toMatchObject({
			leadTitle: 'St. Olaf awarded 2026-27 Hunger Free Campus grant',
			leadPhoto: 'https://olafmessenger.com/grant.png',
		})
		expect(issues[0]?.leadPhoto).toBeNull()
	})

	it('marks the special edition, and only it', () => {
		expect(groupIssues(spring, false).map((issue) => issue.isSpecial)).toStrictEqual([
			true,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
		])
	})

	it('finds no issue in no posts', () => {
		expect(groupIssues([], false)).toStrictEqual([])
	})
})

describe('issueName', () => {
	it("spells out the issue's day", () => {
		expect(issueDate('2026-04-29')).toBe('April 29, 2026')
		expect(issueName({day: '2026-04-29', isSpecial: false})).toBe('April 29, 2026')
	})

	it('names a special edition first', () => {
		expect(issueName({day: '2026-05-12', isSpecial: true})).toBe('Special Edition · May 12, 2026')
	})

	it('counts the stories in the dateline', () => {
		expect(datelineText({day: '2026-04-29', isSpecial: false, count: 35})).toBe(
			'April 29, 2026 · 35 stories',
		)
		expect(datelineText({day: '2026-05-12', isSpecial: true, count: 11})).toBe(
			'Special Edition · May 12, 2026 · 11 stories',
		)
	})
})

describe('parseMediaUrls', () => {
	it("reads each photo's address by its media id", () => {
		let urls = parseMediaUrls([
			{id: 36902, source_url: 'https://olafmessenger.com/grant.png'},
			{id: 7, source_url: 'https://olafmessenger.com/petition.jpg'},
		])
		expect([...urls]).toStrictEqual([
			[36902, 'https://olafmessenger.com/grant.png'],
			[7, 'https://olafmessenger.com/petition.jpg'],
		])
	})

	it('skips an item without an address', () => {
		expect([
			...parseMediaUrls([{id: 1}, {id: 2, source_url: 'https://x.test/a.jpg'}]),
		]).toStrictEqual([[2, 'https://x.test/a.jpg']])
	})
})

describe('withPhotoUrls', () => {
	it("gives each post its photo's address, and none to a post whose photo went unfound", () => {
		let posts = withPhotoUrls(spring, new Map([[36902, 'https://olafmessenger.com/grant.png']]))
		expect(posts.find((post) => post.id === 36896)?.photoUrl).toBe(
			'https://olafmessenger.com/grant.png',
		)
		expect(posts.filter((post) => post.photoUrl !== null)).toHaveLength(1)
	})
})
