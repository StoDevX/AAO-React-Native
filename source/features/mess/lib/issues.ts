import {decode} from '@frogpond/html-lib'
import {z} from 'zod'
import {MESS_LOGO_MEDIA_IDS, SPECIAL_EDITION, inSpecialEdition, placement} from './posts'
import {leadStory} from './shelves'
import type {LightPost, MessCategory, MessIssue} from '../types'

/** A week with at least this many posts is an issue, as are a week's special-edition posts when there are this many. */
export const ISSUE_MIN_POSTS = 5

/** How many posts a page of the issue list asks for: WordPress's most. A shorter page is the last. */
export const ISSUE_PAGE_SIZE = 100

const LightPostSchema = z.object({
	id: z.number(),
	// WordPress's `date` is the paper's own local time, with no zone marker.
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}T/u),
	title: z.object({rendered: z.string()}),
	categories: z.array(z.number()),
	featured_media: z.number(),
})

/**
 * A page of the issue list's light posts. A malformed post is skipped so one bad item does not
 * blank the list; a non-empty page that yields nothing means the shape changed, and throws.
 */
export function parseLightPosts(body: unknown, categories: MessCategory[]): LightPost[] {
	let items = z.array(z.unknown()).parse(body)
	let byId = new Map(categories.map((category) => [category.id, category]))
	let posts = items.flatMap((raw): LightPost[] => {
		let post = LightPostSchema.safeParse(raw)
		if (!post.success) return []
		let {id, date, title, categories: ids, featured_media: media} = post.data
		let {section, featured} = placement(ids, byId)
		let hasPhoto = media !== 0 && !MESS_LOGO_MEDIA_IDS.has(media)
		return [
			{
				id,
				day: date.slice(0, 10),
				title: decode(title.rendered),
				section,
				special: inSpecialEdition(ids, byId),
				featured,
				photo: hasPhoto ? media : null,
				photoUrl: null,
			},
		]
	})
	if (items.length > 0 && posts.length === 0) {
		throw new Error('every Mess post was malformed')
	}
	return posts
}

/** The day `days` after a YYYY-MM-DD day, worked out in UTC so no time zone moves it. */
function dayAfter(day: string, days = 1): string {
	let date = new Date(`${day}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + days)
	return date.toISOString().slice(0, 10)
}

/** The Monday that starts a day's week, in the paper's own days. */
function weekOf(day: string): string {
	let weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
	return dayAfter(day, -((weekday + 6) % 7))
}

/**
 * The weeks with enough special-edition posts to make an edition, by their Monday. Counted by the
 * week rather than the day, so an edition that goes up either side of midnight stays one.
 */
function specialWeeks(posts: LightPost[]): Set<string> {
	let counts = new Map<string, number>()
	for (let post of posts) {
		let week = weekOf(post.day)
		if (post.special) counts.set(week, (counts.get(week) ?? 0) + 1)
	}
	return new Set([...counts].filter(([, count]) => count >= ISSUE_MIN_POSTS).map(([week]) => week))
}

/** The day with the most posts, the newest of any tie: the day the paper printed. */
function busiestDay(posts: LightPost[]): string {
	let counts = new Map<string, number>()
	for (let post of posts) counts.set(post.day, (counts.get(post.day) ?? 0) + 1)
	let best = ''
	let most = 0
	for (let [day, count] of counts) {
		if (count > most || (count === most && day > best)) {
			best = day
			most = count
		}
	}
	return best
}

/** Posts that print together: a week's regular posts, or its special edition. */
type Group = {
	/** The week's Monday */
	start: string
	special: boolean
	posts: LightPost[]
}

/**
 * The issues the loaded posts make, newest first. The posts come newest first, as WordPress
 * lists them. A week, Monday to Sunday, with at least five posts is an issue, named by its busiest
 * day. A quieter week joins the next issue after it, so a paper that starts going up late on
 * Sunday prints with the rest of its posts; a quiet week newer than every issue joins the issue
 * before it instead. A week's special-edition posts, when there are at least five, are an issue
 * of their own, apart from the rest of the week and dated by their busiest day. While another page remains, the oldest week is left
 * out, since that page may hold more of it. WordPress pages by offset, so a post published between
 * two page fetches repeats one post; each counts once.
 */
export function groupIssues(posts: LightPost[], hasMore: boolean): MessIssue[] {
	let seen = new Set<number>()
	let unique = posts.filter((post) => {
		if (seen.has(post.id)) return false
		seen.add(post.id)
		return true
	})
	let oldest = unique.at(-1)
	if (hasMore && oldest) {
		let partial = weekOf(oldest.day)
		unique = unique.filter((post) => weekOf(post.day) !== partial)
	}

	let specials = specialWeeks(unique)
	let byKey = new Map<string, Group>()
	for (let post of unique) {
		let week = weekOf(post.day)
		let special = post.special && specials.has(week)
		let key = `${special ? 'special' : 'week'}:${week}`
		let group = byKey.get(key)
		if (group) group.posts.push(post)
		else byKey.set(key, {start: week, special, posts: [post]})
	}

	// Newest first, so each quiet week finds the issue after it already made.
	let groups: Group[] = []
	// Hermes has no toSorted, so the copy is sorted in place.
	let ordered = [...byKey.values()].sort((a, b) =>
		a.start < b.start ? 1 : a.start > b.start ? -1 : 0,
	)
	let next: Group | undefined
	// Quiet weeks newer than every issue, waiting for the issue before them.
	let newest: LightPost[] = []
	for (let group of ordered) {
		if (group.special) groups.push(group)
		else if (group.posts.length >= ISSUE_MIN_POSTS) {
			// Newer than every post the issue holds, so they go first.
			group.posts.unshift(...newest)
			newest = []
			groups.push(group)
			next = group
		}
		// Older than every post the next issue holds, so they go last.
		else if (next) next.posts.push(...group.posts)
		else newest.push(...group.posts)
	}

	let issues = groups.flatMap((group): MessIssue[] => {
		let lead = leadStory(group.posts)
		if (!lead) return []
		let day = busiestDay(group.posts)
		return [
			{
				// By the week rather than the busiest day, which can change as an edition goes up.
				key: `${group.special ? 'special' : 'week'}:${group.start}`,
				day,
				count: group.posts.length,
				storyIds: group.posts.map((post) => post.id),
				leadId: lead.id,
				leadTitle: lead.title,
				leadPhoto: lead.photoUrl,
				leadHasPhoto: lead.photo !== null,
				isSpecial: group.special,
			},
		]
	})
	// Newest first by the day each is named for, so a Wednesday's paper lists before the special
	// edition of the Tuesday before it; a special edition printed the same day lists first.
	return issues.sort((a, b) => {
		if (a.day !== b.day) return a.day < b.day ? 1 : -1
		return Number(b.isSpecial) - Number(a.isSpecial)
	})
}

/**
 * An issue's day, spelled out: "April 29, 2026". The day is the paper's, so it is read and
 * written in UTC, where no device time zone can move it to the day before.
 */
export function issueDate(day: string): string {
	return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	})
}

/** An issue's name: its date, after "Special Edition · " for a special edition. */
export function issueName(issue: Pick<MessIssue, 'day' | 'isSpecial'>): string {
	let date = issueDate(issue.day)
	return issue.isSpecial ? `${SPECIAL_EDITION} · ${date}` : date
}

/** What an issue's dateline says: its name, and how many stories it holds. */
export function datelineText(issue: Pick<MessIssue, 'day' | 'isSpecial' | 'count'>): string {
	return `${issueName(issue)} · ${issue.count} stories`
}

const MediaUrlSchema = z.object({id: z.number(), source_url: z.string()})

/** Each photo's address by its media id, from `media?include=…&_fields=id,source_url`. */
export function parseMediaUrls(body: unknown): Map<number, string> {
	let items = z.array(z.unknown()).parse(body)
	return new Map(
		items.flatMap((raw): Array<[number, string]> => {
			let item = MediaUrlSchema.safeParse(raw)
			return item.success ? [[item.data.id, item.data.source_url]] : []
		}),
	)
}

/** The posts with their photos' addresses; a photo missing from `urls` has none. */
export function withPhotoUrls(posts: LightPost[], urls: Map<number, string>): LightPost[] {
	return posts.map((post) => ({
		...post,
		photoUrl: post.photo === null ? null : (urls.get(post.photo) ?? null),
	}))
}
