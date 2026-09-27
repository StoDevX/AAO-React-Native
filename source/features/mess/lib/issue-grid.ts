import type {DogEar, SheetShape, StainMark} from '@frogpond/mess-issue-tile'
import {z} from 'zod'
import {parseBlocks} from './blocks'
import {issueDate} from './issues'
import type {Block, MessIssue, MessStory, Run} from '../types'

export type {SheetShape, StainMark}

/** A year's issues on the grid, and how many issues of that year are loaded. */
export type YearGroup = {year: string; count: number; issues: MessIssue[]}

/**
 * The grid under the top tile: every issue after the first, by year, newest first. A year's
 * count takes in every loaded issue of that year, the top tile's too, so it grows as older pages
 * load.
 */
export function yearGroups(issues: MessIssue[]): YearGroup[] {
	let counts = new Map<string, number>()
	for (let each of issues) {
		let year = each.day.slice(0, 4)
		counts.set(year, (counts.get(year) ?? 0) + 1)
	}
	let groups: YearGroup[] = []
	for (let each of issues.slice(1)) {
		let year = each.day.slice(0, 4)
		let last = groups.at(-1)
		if (last?.year === year) last.issues.push(each)
		else groups.push({year, count: counts.get(year) ?? 0, issues: [each]})
	}
	return groups
}

/** A year's tiles in rows of `perRow`, the last row short when they run out. */
export function rowsOf(issues: MessIssue[], perRow: number): MessIssue[][] {
	let rows: MessIssue[][] = []
	for (let index = 0; index < issues.length; index += perRow) {
		rows.push(issues.slice(index, index + perRow))
	}
	return rows
}

/** How many of an issue's stories the reader has opened. */
export function readCount(storyIds: number[], opened: ReadonlySet<number>): number {
	return storyIds.filter((id) => opened.has(id)).length
}

/**
 * How many stains an issue wears: the first once two stories are read (one, for an issue of
 * one), a second at half, a third at three quarters, the fourth when every story is read.
 */
export function stainCount(read: number, total: number): number {
	if (total === 0 || read < Math.min(2, total)) return 0
	let share = read / total
	if (share >= 1) return 4
	if (share >= 0.75) return 3
	if (share >= 0.5) return 2
	return 1
}

/** The spots a stain can land on: the corners, the sides' middles, and the upper and lower middle. */
const SPOTS: ReadonlyArray<readonly [number, number]> = [
	[0.1, 0.12],
	[0.9, 0.1],
	[0.08, 0.55],
	[0.92, 0.5],
	[0.2, 0.9],
	[0.85, 0.88],
	[0.5, 0.3],
	[0.5, 0.75],
]

/** A 32-bit FNV-1a hash, to seed a day's stains. */
function hash(text: string): number {
	let h = 2166136261 // FNV offset basis, 0x811C9DC5
	for (let i = 0; i < text.length; i++) {
		h ^= text.codePointAt(i) ?? 0
		h = Math.imul(h, 0x01000193)
	}
	return h >>> 0
}

/** Mulberry32: a small seeded generator of numbers in [0, 1). */
function generator(seed: number): () => number {
	let state = seed
	return () => {
		state = (state + 1831565813) >>> 0 // 0x6D2B79F5
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * An issue's stains. The day seeds one shuffle of the spots, so the same issue always stains the
 * same way, and the k-th stain has a seed of its own, so a new stain never moves the ones before.
 */
export function stainMarks(day: string, count: number): StainMark[] {
	let shuffle = generator(hash(day))
	let spots = [...SPOTS]
	for (let i = spots.length - 1; i > 0; i--) {
		let j = Math.floor(shuffle() * (i + 1))
		;[spots[i], spots[j]] = [spots[j] as (typeof spots)[number], spots[i] as (typeof spots)[number]]
	}
	return spots.slice(0, count).map(([x, y], k) => {
		let next = generator(hash(`${day}#${k}`))
		return {
			x: clamp(x + (next() - 0.5) * 0.08),
			y: clamp(y + (next() - 0.5) * 0.06),
			radius: 0.2 + next() * 0.08,
			rotation: next() * 360,
			arcStart: next(),
			arcLength: 0.62 + next() * 0.3,
		}
	})
}

const DOG_EARS: readonly DogEar[] = ['topRight', 'bottomRight', 'bottomLeft']

/**
 * How an issue's sheet has been handled, seeded by its day like its stains, so a sheet looks the
 * same every time it is drawn: a slight tilt, now and then a turned corner, two or three faint
 * creases, and the bend below its fold. The top tile is tilted less, since its columns are read
 * as lines of type.
 */
export function sheetShape(day: string, top: boolean): SheetShape {
	let next = generator(hash(`${day}#sheet`))
	let tilt = (next() * 2 - 1) * (top ? 0.3 : 0.8)
	// About one sheet in four has a corner turned; never the top left, where the nameplate sits.
	let earRoll = next()
	let dogEar = earRoll < 0.25 ? (DOG_EARS[Math.floor(next() * DOG_EARS.length)] ?? null) : null
	let creases = Array.from({length: next() < 0.5 ? 2 : 3}, () => ({
		position: 0.15 + next() * 0.7,
		angle: (next() * 2 - 1) * 35,
		strength: 0.3 + next() * 0.7,
	}))
	return {
		tilt,
		dogEar,
		creases,
		edgeSeed: hash(`${day}#edges`),
		bend: 4 + next() * 5,
	}
}

const textOf = (runs: Run[]): string =>
	runs
		.map((run) => run.text)
		.join('')
		.replaceAll(/\s+/gu, ' ')
		.trim()

function blockTexts(block: Block): string[] {
	switch (block.type) {
		case 'paragraph':
		case 'quote':
			return [textOf(block.runs)]
		case 'list':
			return block.items.map(textOf)
		default:
			return []
	}
}

const textsOf = (blocks: Block[]): string[] =>
	blocks.flatMap(blockTexts).filter((text) => text.length > 0)

/** The lead story's words for the top tile's columns: its paragraphs, quotes and list items. */
export function leadParagraphs(story: MessStory | undefined): string[] {
	return textsOf(story?.blocks ?? [])
}

const BodySchema = z.object({content: z.object({rendered: z.string()})})

/**
 * A post's words from `posts/{id}?_fields=content`, as `leadParagraphs` reads a full story's:
 * a grid tile with no photo sets them under its fold. A body it cannot read has none.
 */
export function bodyParagraphs(body: unknown): string[] {
	let post = BodySchema.safeParse(body)
	return post.success ? textsOf(parseBlocks(post.data.content.rendered)) : []
}

/** What VoiceOver reads for a tile: its date, whether it is a special edition, its headline, and the reading. */
export function tileLabel(issue: MessIssue, read: number): string {
	let parts = [issueDate(issue.day)]
	if (issue.isSpecial) parts.push('special edition')
	parts.push(issue.leadTitle)
	if (read > 0) parts.push(`${read} of ${issue.count} stories read`)
	return parts.join(', ')
}
