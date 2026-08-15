import {z} from 'zod'

export const REL_NEWS = 'https://frogpond.tech/rel/news'
export const REL_A_TO_Z = 'https://frogpond.tech/rel/a-to-z'
export const REL_CALENDAR = 'https://frogpond.tech/rel/calendar'

/// JRD `properties` member names are URIs (RFC 7033 §4.4.4.5), so the source
/// id is keyed by one rather than a bare string.
export const ID_PROPERTY = 'https://frogpond.tech/ns/id'

const JrdLinkSchema = z.object({
	rel: z.url(),
	href: z.url(),
	type: z.string().min(1),
	titles: z.record(z.string(), z.string()).optional(),
	properties: z.object({[ID_PROPERTY]: z.string().min(1)}),
})

export type Jrd = z.infer<typeof JrdSchema>
export const JrdSchema = z.object({
	subject: z.string(),
	links: z.array(JrdLinkSchema),
})

export interface ResolvedSource {
	id: string
	href: string
	type: string
	title: string | undefined
}
