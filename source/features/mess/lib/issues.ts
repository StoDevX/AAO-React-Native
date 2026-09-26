import {decode} from '@frogpond/html-lib'
import {z} from 'zod'
import {MESS_LOGO_MEDIA_IDS, SPECIAL_EDITION, inSpecialEdition, placement} from './posts'
import {leadStory} from './shelves'
import type {LightPost, MessCategory, MessIssue} from '../types'

/** A day with at least this many posts is an issue; a day with fewer holds strays. */
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

/** The day before a YYYY-MM-DD day, worked out in UTC so no time zone moves it. */
function dayBefore(day: string): string {
	let date = new Date(`${day}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() - 1)
	return date.toISOString().slice(0, 10)
}

type Group = {day: string; posts: LightPost[]}

/**
 * The issues the loaded posts make, newest first. The posts come newest first, as WordPress
 * lists them. A day with at least five posts is an issue; a day with fewer joins the most
 * recent issue before it, and a stray older than every issue is left out. While another page
 * remains, the oldest day is left out too, since that page may hold more of it. WordPress pages
 * by offset, so a post published between two page fetches repeats one post; each counts once.
 */
export function groupIssues(posts: LightPost[], hasMore: boolean): MessIssue[] {
	let seen = new Set<number>()
	let days: LightPost[][] = []
	for (let post of posts) {
		if (seen.has(post.id)) continue
		seen.add(post.id)
		let last = days.at(-1)
		if (last && last[0]?.day === post.day) last.push(post)
		else days.push([post])
	}
	if (hasMore) days.pop()

	// Oldest first, so each stray finds the issue before it already made.
	let groups: Group[] = []
	for (let day of days.toReversed()) {
		let first = day[0]
		if (!first) continue
		let current = groups.at(-1)
		if (day.length >= ISSUE_MIN_POSTS) groups.push({day: first.day, posts: [...day]})
		// A stray is newer than every post the issue already holds, so it goes first.
		else if (current) current.posts.unshift(...day)
	}

	let newestFirst = groups.toReversed()
	return newestFirst.flatMap((group, index): MessIssue[] => {
		let lead = leadStory(group.posts)
		if (!lead) return []
		let newer = newestFirst[index - 1]
		return [
			{
				day: group.day,
				after: `${dayBefore(group.day)}T23:59:59`,
				before: newer ? `${newer.day}T00:00:00` : null,
				count: group.posts.length,
				leadId: lead.id,
				leadTitle: lead.title,
				leadPhoto: lead.photoUrl,
				// Most of its posts, since one special-edition post can run on a regular day.
				isSpecial: group.posts.filter((post) => post.special).length * 2 > group.posts.length,
			},
		]
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

/** The kicker on Top's banner for a special edition: "Special Edition · May 12", in UTC as `issueDate` is. */
export function bannerKicker(issue: Pick<MessIssue, 'day'>): string {
	let date = new Date(`${issue.day}T00:00:00Z`).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	})
	return `${SPECIAL_EDITION} · ${date}`
}

/**
 * The issue Top shows, and the banner above it. Top is the newest issue that is not a special
 * edition; `special` is a special edition newer than Top, if there is one. With no regular
 * issue loaded, there is no Top, and Top falls back to the feed.
 */
export function topOf(issues: MessIssue[]): {
	top: MessIssue | undefined
	special: MessIssue | undefined
} {
	let index = issues.findIndex((issue) => !issue.isSpecial)
	let newer = index === -1 ? issues : issues.slice(0, index)
	return {
		top: index === -1 ? undefined : issues[index],
		special: newer.find((issue) => issue.isSpecial),
	}
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
