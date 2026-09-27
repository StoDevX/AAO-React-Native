import {describe, expect, test} from '@jest/globals'
import {
	bodyParagraphs,
	leadParagraphs,
	readCount,
	rowsOf,
	sheetShape,
	stainCount,
	stainMarks,
	tileLabel,
	yearGroups,
} from '../issue-grid'
import type {MessIssue, MessStory} from '../../types'

function issue(day: string, extra: Partial<MessIssue> = {}): MessIssue {
	return {
		key: `week:${day}`,
		day,
		count: 5,
		storyIds: [1, 2, 3, 4, 5],
		leadId: 1,
		leadTitle: `Lead of ${day}`,
		leadPhoto: null,
		isSpecial: false,
		...extra,
	}
}

describe('yearGroups', () => {
	test('groups the issues after the first by year, counting the first in its year', () => {
		let groups = yearGroups([
			issue('2026-05-12'),
			issue('2026-04-29'),
			issue('2026-03-25'),
			issue('2025-12-03'),
		])
		expect(groups.map((g) => [g.year, g.count, g.issues.map((i) => i.day)])).toStrictEqual([
			['2026', 3, ['2026-04-29', '2026-03-25']],
			['2025', 1, ['2025-12-03']],
		])
	})

	test('gives a year the top issue alone no group of its own', () => {
		expect(yearGroups([issue('2026-01-10'), issue('2025-12-03')])).toStrictEqual([
			{year: '2025', count: 1, issues: [issue('2025-12-03')]},
		])
	})

	test('has nothing to group with one issue or none', () => {
		expect(yearGroups([issue('2026-05-12')])).toStrictEqual([])
		expect(yearGroups([])).toStrictEqual([])
	})
})

test('readCount counts the issue stories the reader has opened', () => {
	expect(readCount([1, 2, 3], new Set([2, 3, 99]))).toBe(2)
	expect(readCount([1, 2, 3], new Set())).toBe(0)
})

describe('stainCount', () => {
	test.each([
		[0, 34, 0],
		[1, 34, 0],
		[2, 34, 1],
		[16, 34, 1],
		[17, 34, 2],
		[25, 34, 2],
		[26, 34, 3],
		[33, 34, 3],
		[34, 34, 4],
		[0, 1, 0],
		[1, 1, 4],
		[1, 2, 0],
		[2, 2, 4],
		[0, 0, 0],
	])('%i of %i read gives %i', (read, total, stains) => {
		expect(stainCount(read, total)).toBe(stains)
	})
})

describe('stainMarks', () => {
	test('places the same stains for the same day every time', () => {
		expect(stainMarks('2026-04-29', 4)).toStrictEqual(stainMarks('2026-04-29', 4))
	})

	test('keeps earlier stains where they were when another is added', () => {
		let three = stainMarks('2026-04-29', 3)
		expect(stainMarks('2026-04-29', 4).slice(0, 3)).toStrictEqual(three)
	})

	test('places another day differently', () => {
		expect(stainMarks('2026-03-25', 2)).not.toStrictEqual(stainMarks('2026-04-29', 2))
	})

	test('gives no two stains of one issue the same spot', () => {
		let spots = stainMarks('2026-04-29', 4).map(
			(m) => `${Math.round(m.x * 10)},${Math.round(m.y * 10)}`,
		)
		expect(new Set(spots).size).toBe(4)
	})

	test('keeps every stain within the sheet, at a ring size and a worn gap', () => {
		for (let mark of stainMarks('2026-02-18', 4)) {
			expect(mark.x).toBeGreaterThanOrEqual(0)
			expect(mark.x).toBeLessThanOrEqual(1)
			expect(mark.y).toBeGreaterThanOrEqual(0)
			expect(mark.y).toBeLessThanOrEqual(1)
			expect(mark.radius).toBeGreaterThanOrEqual(0.2)
			expect(mark.radius).toBeLessThanOrEqual(0.28)
			expect(mark.arcLength).toBeGreaterThanOrEqual(0.62)
			expect(mark.arcLength).toBeLessThanOrEqual(0.92)
		}
	})

	test('draws none for a count of none', () => {
		expect(stainMarks('2026-04-29', 0)).toStrictEqual([])
	})
})

describe('leadParagraphs', () => {
	const base: MessStory = {
		id: 1,
		title: 'T',
		excerpt: '',
		link: '',
		published: '2026-04-29T22:00:00.000Z',
		section: 'News',
		column: null,
		featured: false,
		bylines: [],
		photo: null,
		blocks: [],
		layout: {kind: 'article'},
	}

	test('keeps paragraphs, quotes and list items as plain text, and drops figures and embeds', () => {
		let story: MessStory = {
			...base,
			blocks: [
				{type: 'paragraph', runs: [{text: 'One '}, {text: 'two', bold: true}]},
				{type: 'figure', url: 'x', width: 1, height: 1, caption: 'c'},
				{type: 'quote', runs: [{text: 'Said so.'}]},
				{type: 'list', ordered: false, items: [[{text: 'a'}], [{text: 'b'}]]},
				{type: 'embed', url: 'y'},
				{type: 'paragraph', runs: [{text: '   '}]},
			],
		}
		expect(leadParagraphs(story)).toStrictEqual(['One two', 'Said so.', 'a', 'b'])
	})

	test('has nothing before the story loads', () => {
		expect(leadParagraphs(undefined)).toStrictEqual([])
	})
})

describe('tileLabel', () => {
	test('reads the date, the headline, and how much the reader has read', () => {
		expect(tileLabel(issue('2026-04-29', {leadTitle: 'Grant'}), 3)).toBe(
			'April 29, 2026, Grant, 3 of 5 stories read',
		)
	})

	test('leaves out the reading when none is read, and says a special edition is one', () => {
		expect(tileLabel(issue('2026-05-12', {leadTitle: 'Letter', isSpecial: true}), 0)).toBe(
			'May 12, 2026, special edition, Letter',
		)
	})
})

describe('sheetShape', () => {
	const DAYS = Array.from({length: 60}, (_, n) => {
		let date = new Date(Date.UTC(2025, 0, 1 + n * 7))
		return date.toISOString().slice(0, 10)
	})

	test('handles the same issue the same way every time', () => {
		expect(sheetShape('2026-04-29', false)).toStrictEqual(sheetShape('2026-04-29', false))
	})

	test('handles two issues differently', () => {
		expect(sheetShape('2026-03-25', false)).not.toStrictEqual(sheetShape('2026-04-29', false))
	})

	test('tilts a grid sheet a little either way, and the top sheet less', () => {
		let tilts = DAYS.map((day) => sheetShape(day, false).tilt)
		expect(Math.max(...tilts.map(Math.abs))).toBeLessThanOrEqual(0.8)
		expect(tilts.some((tilt) => tilt < 0)).toBe(true)
		expect(tilts.some((tilt) => tilt > 0)).toBe(true)
		for (let day of DAYS) {
			expect(Math.abs(sheetShape(day, true).tilt)).toBeLessThanOrEqual(0.3)
		}
	})

	test('dog-ears some sheets, not most, and never the top-left corner under the nameplate', () => {
		let corners = DAYS.map((day) => sheetShape(day, false).dogEar)
		let eared = corners.filter((corner) => corner !== null)
		expect(eared.length).toBeGreaterThan(0)
		expect(eared.length).toBeLessThan(DAYS.length / 2)
		for (let corner of eared) {
			expect(['topRight', 'bottomRight', 'bottomLeft']).toContain(corner)
		}
	})

	test('creases each sheet two or three times, across it, faintly', () => {
		for (let day of DAYS) {
			let {creases} = sheetShape(day, false)
			expect(creases.length).toBeGreaterThanOrEqual(2)
			expect(creases.length).toBeLessThanOrEqual(3)
			for (let crease of creases) {
				expect(crease.position).toBeGreaterThanOrEqual(0.15)
				expect(crease.position).toBeLessThanOrEqual(0.85)
				expect(Math.abs(crease.angle)).toBeLessThanOrEqual(35)
				expect(crease.strength).toBeGreaterThanOrEqual(0.3)
				expect(crease.strength).toBeLessThanOrEqual(1)
			}
		}
	})

	test('bends the sheet back at its fold by a few degrees', () => {
		for (let day of DAYS) {
			let {bend} = sheetShape(day, false)
			expect(bend).toBeGreaterThanOrEqual(4)
			expect(bend).toBeLessThanOrEqual(9)
		}
	})

	test("gives each sheet's edges a seed of their own", () => {
		let seeds = new Set(DAYS.map((day) => sheetShape(day, false).edgeSeed))
		expect(seeds.size).toBe(DAYS.length)
	})
})

describe('bodyParagraphs', () => {
	test("reads a post's body as the plain text of its paragraphs, quotes and list items", () => {
		let body = {
			content: {
				rendered:
					'<p>One <strong>two</strong></p><figure><img src="x.jpg"/></figure>' +
					'<blockquote><p>Said so.</p></blockquote><ul><li>a</li><li>b</li></ul>',
			},
		}
		expect(bodyParagraphs(body)).toStrictEqual(['One two', 'Said so.', 'a', 'b'])
	})

	test('has nothing for a body it cannot read', () => {
		expect(bodyParagraphs({})).toStrictEqual([])
		expect(bodyParagraphs(null)).toStrictEqual([])
	})
})

describe('rowsOf', () => {
	test('sets the tiles two to a row, the last row short when they run out', () => {
		let days = ['a', 'b', 'c', 'd', 'e'].map((day) => issue(day))
		expect(rowsOf(days, 2).map((row) => row.map((each) => each.day))).toStrictEqual([
			['a', 'b'],
			['c', 'd'],
			['e'],
		])
	})

	test('sets them four to a row across a landscape screen', () => {
		let days = ['a', 'b', 'c', 'd', 'e'].map((day) => issue(day))
		expect(rowsOf(days, 4).map((row) => row.map((each) => each.day))).toStrictEqual([
			['a', 'b', 'c', 'd'],
			['e'],
		])
	})
})
