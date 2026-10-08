import {carletonClient} from '@frogpond/api'
import {queryOptions} from '@tanstack/react-query'
import {z} from 'zod'

/** One episode of the convocations podcast, as Carleton's ccc-server relays it. */
const WireEpisodeSchema = z.object({
	title: z.string(),
	description: z.string().default(''),
	// An episode without one is left out by `toArchivedConvos`, not the whole list with it.
	pubDate: z.string().default(''),
	enclosure: z
		.object({url: z.string(), type: z.string().default(''), length: z.string().default('')})
		.nullable()
		.default(null),
})

type WireEpisode = z.infer<typeof WireEpisodeSchema>

/** A past convocation with a recording to play. */
export type ArchivedConvo = {
	title: string
	description: string
	published: Date
	recordingUrl: string
	/** Whether the recording is video rather than audio alone. */
	isVideo: boolean
}

/**
 * The episodes worth listing, newest first: one without a recording has
 * nothing to open, and one with an unreadable date cannot be placed.
 */
export function toArchivedConvos(episodes: WireEpisode[]): ArchivedConvo[] {
	return episodes
		.flatMap((episode) => {
			let published = new Date(episode.pubDate)
			if (!episode.enclosure?.url || Number.isNaN(published.getTime())) {
				return []
			}
			return [
				{
					title: episode.title.trim(),
					description: episode.description.trim(),
					published,
					recordingUrl: episode.enclosure.url,
					isVideo: episode.enclosure.type.startsWith('video/'),
				},
			]
		})
		.toSorted((a, b) => b.published.getTime() - a.published.getTime())
}

/** The recordings in the server's `convos/archived` answer. */
export function archivedConvosFrom(body: unknown): ArchivedConvo[] {
	return toArchivedConvos(z.array(WireEpisodeSchema).parse(body))
}

/** Recordings change once a week at most, so an hour stale costs nothing. */
const staleTime = 1000 * 60 * 60

export const archivedConvosOptions = queryOptions({
	queryKey: ['carleton', 'convos', 'archived'] as const,
	queryFn: async ({signal}): Promise<ArchivedConvo[]> => {
		let body = await carletonClient.get('convos/archived', {signal}).json()
		return archivedConvosFrom(body)
	},
	staleTime,
})
