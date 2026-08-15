import {z} from 'zod'

export const REL_NEWS = 'https://frogpond.tech/rel/news'
export const REL_A_TO_Z = 'https://frogpond.tech/rel/a-to-z'
export const REL_CALENDAR = 'https://frogpond.tech/rel/calendar'

/// JRD `properties` member names are URIs (RFC 7033 §4.4.4.5), so the source
/// id is keyed by one rather than a bare string.
export const ID_PROPERTY = 'https://frogpond.tech/ns/id'

/// A proxied source's href is relative (e.g. `news/named/mess`), so it
/// resolves against the configured api root and honours the Settings
/// server-URL override; a direct source's href is an absolute URL. Both
/// shapes are valid, so this accepts a URI reference (RFC 3986 §4.1) rather
/// than `z.url()`, which rejects the relative form outright. The pattern
/// just excludes whitespace and the other code points a URI reference
/// cannot contain unencoded -- it is not a full RFC 3986 parser, only enough
/// to reject nonsense like `"not a url"`.
const HREF_PATTERN = /^[^\s<>"{}|\\^`]+$/u
const HrefSchema = z.string().min(1).regex(HREF_PATTERN)

const JrdLinkSchema = z.object({
	rel: z.url(),
	href: HrefSchema,
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
