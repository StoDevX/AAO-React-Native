import {decode, fastGetTrimmedText} from '@frogpond/html-lib'
import {z} from 'zod'
import type {StaffProfile} from '../types'

const TermSchema = z.object({name: z.string(), taxonomy: z.string()})
const MediaSchema = z.object({
	source_url: z.string(),
	media_details: z.object({width: z.number(), height: z.number()}),
})

const ProfileSchema = z.object({
	title: z.object({rendered: z.string()}),
	content: z.object({rendered: z.string()}),
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
			return [
				{
					name: decode(profile.data.title.rendered),
					bio: fastGetTrimmedText(profile.data.content.rendered),
					photo: media.success
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
