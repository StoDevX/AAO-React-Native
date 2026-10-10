import {decode, fastGetTrimmedText} from '@frogpond/html-lib'
import {z} from 'zod'
import type {StaffProfile} from '../types'

const TermSchema = z.object({name: z.string(), taxonomy: z.string()})
const SizeSchema = z.object({source_url: z.string(), width: z.number(), height: z.number()})
const MediaSchema = z.object({
	source_url: z.string(),
	media_details: z.object({
		width: z.number(),
		height: z.number(),
		/** Smaller copies WordPress made of the upload; `medium` is 450 by 600 for a portrait */
		sizes: z.object({medium: SizeSchema.optional()}).optional(),
	}),
})

/** A trailing ellipsis, as WordPress ends an excerpt it made: ` […]`, `…` or `...`. */
const TRAILING_ELLIPSIS = /\s*\[?(?:…|\.\.\.)\]?$/u

/** More words than any title the paper has used, which run to four, such as `Arts and Entertainment Editors`. */
const MAX_ROLE_WORDS = 8

/**
 * A profile's role, from its excerpt. WordPress fills a blank excerpt with the start of the bio,
 * cut off with an ellipsis, which is no role; so is any excerpt longer than a title runs. A bio
 * short enough to need no cutting becomes the whole excerpt, with no ellipsis, so an excerpt that
 * is the bio is no role either.
 */
function roleOf(excerptHtml: string, bio: string): string {
	let excerpt = fastGetTrimmedText(excerptHtml)
	let made =
		TRAILING_ELLIPSIS.test(excerpt) ||
		excerpt.split(' ').length > MAX_ROLE_WORDS ||
		(excerpt !== '' && excerpt === bio)
	return made ? '' : excerpt
}

const ProfileSchema = z.object({
	id: z.number(),
	title: z.object({rendered: z.string()}),
	content: z.object({rendered: z.string()}),
	/** The writer's role on the paper, such as `News Editor` */
	excerpt: z.object({rendered: z.string()}).optional(),
	_embedded: z
		.object({
			'wp:featuredmedia': z.array(z.unknown()).optional(),
			'wp:term': z.array(z.array(z.unknown())).optional(),
		})
		.optional(),
})

/// The `staff_year` term among a profile's terms, or blank when it has none.
function yearOf(terms: unknown[]): string {
	for (let raw of terms) {
		let term = TermSchema.safeParse(raw)
		if (term.success && term.data.taxonomy === 'staff_year') return term.data.name
	}
	return ''
}

/** Every profile in the response; a malformed one is skipped. */
export function parseStaffProfiles(body: unknown): StaffProfile[] {
	return z
		.array(z.unknown())
		.parse(body)
		.flatMap((raw) => {
			let profile = ProfileSchema.safeParse(raw)
			if (!profile.success) return []
			let media = MediaSchema.safeParse(profile.data._embedded?.['wp:featuredmedia']?.[0])
			// The full upload is about 1500 by 2000; a tile or a byline needs no more than medium.
			let medium = media.success ? media.data.media_details.sizes?.medium : undefined
			let bio = fastGetTrimmedText(profile.data.content.rendered)
			return [
				{
					id: profile.data.id,
					name: decode(profile.data.title.rendered),
					role: roleOf(profile.data.excerpt?.rendered ?? '', bio),
					bio,
					photo: medium
						? {url: medium.source_url, width: medium.width, height: medium.height}
						: media.success
							? {
									url: media.data.source_url,
									width: media.data.media_details.width,
									height: media.data.media_details.height,
								}
							: null,
					year: yearOf((profile.data._embedded?.['wp:term'] ?? []).flat()),
				},
			]
		})
}

/** The profile for the newest staff year. Years read `2025-2026`, so they sort as text. */
export function latestProfile(profiles: StaffProfile[]): StaffProfile | null {
	return [...profiles].sort((a, b) => b.year.localeCompare(a.year))[0] ?? null
}
