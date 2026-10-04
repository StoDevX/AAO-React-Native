import {describe, expect, it} from '@jest/globals'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import springPosts from '../../__tests__/fixtures/issue-posts.json'
import type {LightPost, MessIssue} from '../../types'
import {
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

/** The first and last days an issue's posts went up, found from the ids it fetches its stories by. */
function daysIn(issue: MessIssue | undefined): {first: string; last: string} {
	let ids = new Set(issue?.storyIds)
	let days = spring
		.filter((post) => ids.has(post.id))
		.map((post) => post.day)
		.sort()
	return {first: days[0] ?? '', last: days.at(-1) ?? ''}
}

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

/** `count` posts on `day`, ids counting down from `newestId`, marked special as `special` says. */
function postsOn(day: string, count: number, newestId: number, special = false): LightPost[] {
	return Array.from({length: count}, (_, offset) => ({
		id: newestId - offset,
		day,
		title: `Story ${newestId - offset}`,
		section: special ? 'Special Edition' : 'News',
		special,
		featured: false,
		photo: null,
		photoUrl: null,
	}))
}

describe('groupIssues', () => {
	// The paper's stray posts follow it: May 7 went up the week after Apr 29's paper.
	it('keeps a quiet week with the issue before it once a newer issue loads', () => {
		let september = postsOn('2026-09-09', 6, 50000)
		let issues = groupIssues([...september, ...spring], false)
		expect(outline(issues).slice(0, 3)).toStrictEqual([
			['2026-09-09', 6],
			['2026-05-12', 11],
			['2026-04-29', 35],
		])
	})

	// A quiet week's posts join the issue, but went up after it printed.
	it("leads and names an issue by its own week's posts, not a quiet week that joined it", () => {
		let paper = [
			...postsOn('2026-04-29', 2, 120),
			...postsOn('2026-04-28', 2, 110),
			...postsOn('2026-04-27', 1, 100),
		].map((post) => (post.id === 120 ? {...post, featured: true} : post))
		let quiet = postsOn('2026-05-07', 3, 200).map((post) => ({...post, featured: true}))
		let [issue] = groupIssues([...quiet, ...paper], false)
		expect(issue).toMatchObject({day: '2026-04-29', count: 8, leadId: 120})
	})

	// The next page may hold the rest of the oldest week, special edition included.
	it('leaves out the oldest week, special edition too, while another page remains', () => {
		let posts = [
			...postsOn('2026-03-11', 5, 300),
			...postsOn('2026-03-04', 5, 200),
			...postsOn('2026-03-03', 2, 100, true),
		]
		expect(outline(groupIssues(posts, true))).toStrictEqual([['2026-03-11', 5]])
		expect(outline(groupIssues(posts, false))).toStrictEqual([
			['2026-03-11', 5],
			['2026-03-04', 5],
			['2026-03-03', 2],
		])
	})

	it('joins a quiet week to the regular issue before it, not to a special edition between', () => {
		let posts = [
			...postsOn('2026-03-19', 1, 400),
			...postsOn('2026-03-10', 3, 300, true),
			...postsOn('2026-03-04', 5, 200),
		]
		expect(
			groupIssues(posts, false).map((issue) => [issue.day, issue.count, issue.isSpecial]),
		).toStrictEqual([
			['2026-03-10', 3, true],
			['2026-03-04', 6, false],
		])
	})

	it('joins a quiet week newer than every issue to the issue before it', () => {
		let posts = [...postsOn('2026-03-23', 2, 200), ...postsOn('2026-03-11', 5, 50)]
		expect(outline(groupIssues(posts, false))).toStrictEqual([['2026-03-11', 7]])
	})

	// A special edition that goes up either side of midnight is still one edition.
	it("makes one special edition of a week's special posts, named by their busiest day", () => {
		let posts = [
			...postsOn('2026-05-12', 3, 300, true),
			...postsOn('2026-05-11', 2, 200, true),
			...postsOn('2026-05-13', 5, 100),
		]
		expect(
			groupIssues(posts, false).map((issue) => [
				issue.key,
				issue.day,
				issue.count,
				issue.isSpecial,
			]),
		).toStrictEqual([
			['week:2026-05-11', '2026-05-13', 5, false],
			['special:2026-05-11', '2026-05-12', 5, true],
		])
	})

	// A reader can be on an edition's page while its posts are still going up.
	it("keeps a special edition's key as more of its posts go up and its busiest day changes", () => {
		let wednesday = postsOn('2026-05-13', 3, 300, true)
		let tuesday = postsOn('2026-05-12', 3, 200, true)
		let before = groupIssues([...wednesday, ...tuesday], false)
		let after = groupIssues(
			[...wednesday, ...tuesday, ...postsOn('2026-05-12', 1, 150, true)],
			false,
		)
		expect(before.map((issue) => [issue.key, issue.day])).toStrictEqual([
			['special:2026-05-11', '2026-05-13'],
		])
		expect(after.map((issue) => [issue.key, issue.day])).toStrictEqual([
			['special:2026-05-11', '2026-05-12'],
		])
	})

	it("makes a special edition of a week's special posts however few there are", () => {
		let posts = [...postsOn('2026-05-12', 2, 300, true), ...postsOn('2026-05-13', 5, 100)]
		expect(
			groupIssues(posts, false).map((issue) => [issue.day, issue.count, issue.isSpecial]),
		).toStrictEqual([
			['2026-05-13', 5, false],
			['2026-05-12', 2, true],
		])
	})

	it("finds the spring's eight issues, a week each, newest first", () => {
		expect(outline(groupIssues(spring, false))).toStrictEqual([
			['2026-05-12', 11],
			['2026-04-29', 35],
			['2026-03-25', 27],
			['2026-03-18', 29],
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
		expect(march?.storyIds).toHaveLength(29)
		expect(new Set(march?.storyIds).size).toBe(29)
	})

	// A special edition on the Tuesday and the paper on the Wednesday are two issues.
	it('keeps a special edition apart from the regular issue of its week', () => {
		let tuesday = spring
			.filter((post) => post.day === '2026-05-12')
			.map((post) => ({...post, day: '2026-04-28'}))
		let week = [...spring.filter((post) => post.day === '2026-04-29'), ...tuesday]
		expect(
			groupIssues(week, false).map((issue) => [issue.day, issue.count, issue.isSpecial]),
		).toStrictEqual([
			['2026-04-29', 34, false],
			['2026-04-28', 11, true],
		])
	})

	// A special edition printed on the same day as the week's paper is still an issue of its own.
	it('tells apart a special edition and the regular issue printed the same day', () => {
		let special = spring
			.filter((post) => post.day === '2026-05-12')
			.map((post) => ({...post, day: '2026-04-29'}))
		let day = [...special, ...spring.filter((post) => post.day === '2026-04-29')]
		let issues = groupIssues(day, false)
		expect(issues.map((issue) => [issue.key, issue.day, issue.isSpecial])).toStrictEqual([
			['special:2026-04-27', '2026-04-29', true],
			['week:2026-04-27', '2026-04-29', false],
		])
	})

	it("names a week's issue by its busiest day, the day it printed", () => {
		let early = spring
			.filter((post) => post.day === '2026-03-18')
			.slice(0, 6)
			.map((post) => ({...post, day: '2026-03-20'}))
		let rest = spring.filter((post) => post.day === '2026-03-18').slice(6)
		expect(outline(groupIssues([...early, ...rest], false))).toStrictEqual([['2026-03-18', 29]])
	})

	it('makes a special edition of its posts whatever sections they sit in', () => {
		let filedUnderNews = spring.map((post) => (post.special ? {...post, section: 'News'} : post))
		expect(groupIssues(filedUnderNews, false)[0]).toMatchObject({
			day: '2026-05-12',
			isSpecial: true,
		})
	})

	it("takes a special edition's post out of its week's regular issue", () => {
		let oneSpecial = spring.map((post) => (post.id === 36896 ? {...post, special: true} : post))
		let april = groupIssues(oneSpecial, false).filter((issue) => issue.day === '2026-04-29')
		expect(april.map((issue) => [issue.count, issue.isSpecial])).toStrictEqual([
			[1, true],
			[34, false],
		])
	})

	it('runs a week from Monday to the Monday of the next issue', () => {
		expect(issueOn('2026-03-18')?.count).toBe(29)
		let {first, last} = daysIn(issueOn('2026-03-18'))
		expect(first >= '2026-03-16' && last < '2026-03-23').toBe(true)
	})

	it('takes in the posts of Mar 23, 24 and 26, all in the week of Mar 25', () => {
		expect(issueOn('2026-03-25')?.count).toBe(27)
		expect(daysIn(issueOn('2026-03-25')).first).toBe('2026-03-23')
		expect(daysIn(issueOn('2026-03-25')).last < '2026-04-27').toBe(true)
	})

	it('joins the quiet week of May 7 to Apr 29, the issue before it', () => {
		expect(issueOn('2026-04-29')?.count).toBe(35)
		expect(daysIn(issueOn('2026-04-29')).first >= '2026-04-27').toBe(true)
	})

	it('takes in Sunday, Mar 1, in the week of Feb 25', () => {
		expect(issueOn('2026-02-25')?.count).toBe(30)
		expect(daysIn(issueOn('2026-02-25')).last).toBe('2026-03-01')
	})

	it('runs the newest regular issue to now, past a special edition newer than it', () => {
		expect(daysIn(issueOn('2026-04-29')).last).toBe('2026-05-07')
	})

	it('runs a special edition for its day alone', () => {
		expect(daysIn(issueOn('2026-05-12'))).toStrictEqual({first: '2026-05-12', last: '2026-05-12'})
	})

	it('leaves out a stray older than every issue', () => {
		let fromMarch = spring.filter((post) => post.day >= '2026-03-01')
		expect(groupIssues(fromMarch, false).at(-1)).toMatchObject({day: '2026-03-04', count: 26})
	})

	// Page 1 ends 27 posts into Mar 18, whose other two are on page 2.
	it('holds back the oldest week while another page may hold more of it', () => {
		expect(outline(groupIssues(spring.slice(0, 100), true))).toStrictEqual([
			['2026-05-12', 11],
			['2026-04-29', 35],
			['2026-03-25', 27],
		])
	})

	it("picks each issue's lead from its light fields, with its photo's address", () => {
		let photos = new Map([[36902, 'https://olafmessenger.com/grant.png']])
		let issues = groupIssues(withPhotoUrls(spring, photos), false)
		expect(issues.map((issue) => issue.leadId)).toStrictEqual([
			36949, 36896, 36726, 36650, 36572, 36452, 36361, 36284,
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
