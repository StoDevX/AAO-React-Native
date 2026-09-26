import {describe, expect, it} from '@jest/globals'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import springPosts from '../../__tests__/fixtures/issue-posts.json'
import type {MessIssue} from '../../types'
import {
	bannerKicker,
	datelineText,
	groupIssues,
	issueDate,
	issueName,
	parseLightPosts,
	parseMediaUrl,
	topOf,
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
			featured: false,
			// Its featured image is the Mess logo, which is no photo.
			photo: null,
		})
		expect(spring.find((post) => post.id === 36896)).toStrictEqual({
			id: 36896,
			day: '2026-04-29',
			title: 'St. Olaf awarded 2026-27 Hunger Free Campus grant',
			section: 'News',
			featured: true,
			photo: 36902,
		})
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

	// Review Focus 2: page 1 ends 27 posts into Mar 18, whose other two are on page 2.
	it('holds back the oldest day while another page may hold more of it', () => {
		expect(outline(groupIssues(spring.slice(0, 100), true))).toStrictEqual([
			['2026-05-12', 11],
			['2026-04-29', 35],
			['2026-03-25', 25],
		])
	})

	it("picks each issue's lead from its light fields", () => {
		let issues = groupIssues(spring, false)
		expect(issues.map((issue) => issue.leadId)).toStrictEqual([
			36949, 36896, 36726, 36715, 36572, 36452, 36361, 36284,
		])
		expect(issues[1]).toMatchObject({
			leadTitle: 'St. Olaf awarded 2026-27 Hunger Free Campus grant',
			leadPhoto: 36902,
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

describe('topOf', () => {
	let issues = groupIssues(spring, false)

	it('puts Top on the newest regular issue, with the newer special edition for its banner', () => {
		let {top, special} = topOf(issues)
		expect(top?.day).toBe('2026-04-29')
		expect(special?.day).toBe('2026-05-12')
	})

	it('has no banner when the newest issue is regular', () => {
		let {top, special} = topOf(issues.slice(1))
		expect(top?.day).toBe('2026-04-29')
		expect(special).toBeUndefined()
	})

	it('has no banner for a special edition older than Top', () => {
		let [may12, april29] = issues
		if (!may12 || !april29) throw new Error('the spring has no May 12 or Apr 29 issue')
		let {top, special} = topOf([
			{...april29, before: null},
			{...may12, day: '2026-04-01'},
		])
		expect(top?.day).toBe('2026-04-29')
		expect(special).toBeUndefined()
	})

	it('has no Top when every loaded issue is a special edition', () => {
		let {top, special} = topOf(issues.slice(0, 1))
		expect(top).toBeUndefined()
		expect(special?.day).toBe('2026-05-12')
	})

	it('has neither for no issues', () => {
		expect(topOf([])).toStrictEqual({top: undefined, special: undefined})
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

describe('bannerKicker', () => {
	it('names a special edition by its day, without the year', () => {
		expect(bannerKicker({day: '2026-05-12'})).toBe('Special Edition · May 12')
	})
})

describe('parseMediaUrl', () => {
	it("reads a photo's address", () => {
		expect(parseMediaUrl({source_url: 'https://olafmessenger.com/grant.png'})).toBe(
			'https://olafmessenger.com/grant.png',
		)
	})

	it('throws for a body without one', () => {
		expect(() => parseMediaUrl({code: 'rest_post_invalid_id'})).toThrow()
	})
})
