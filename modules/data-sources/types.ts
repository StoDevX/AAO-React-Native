import {z} from 'zod'

export const REL_NEWS = 'https://frogpond.tech/rel/news'
export const REL_A_TO_Z = 'https://frogpond.tech/rel/a-to-z'
export const REL_CALENDAR = 'https://frogpond.tech/rel/calendar'
export const REL_JOBS = 'https://frogpond.tech/rel/jobs'
export const REL_ORG_CATEGORIES = 'https://frogpond.tech/rel/org-categories'
export const REL_MAP_CATEGORIES = 'https://frogpond.tech/rel/map-categories'
export const REL_STUDENT_WORK_AREAS = 'https://frogpond.tech/rel/student-work-areas'
export const REL_STUDENT_WAGES = 'https://frogpond.tech/rel/student-wages'
export const REL_STUDENT_WORK_UNITS = 'https://frogpond.tech/rel/student-work-units'
export const REL_MAP_STYLE = 'https://frogpond.tech/rel/map-style'
export const REL_COURSE_CATALOG = 'https://frogpond.tech/rel/course-catalog'
export const REL_RADIO_STREAM = 'https://frogpond.tech/rel/radio-stream'
export const REL_RADIO_PLAYER_PAGE = 'https://frogpond.tech/rel/radio-player-page'
export const REL_RADIO_NOW_PLAYING = 'https://frogpond.tech/rel/radio-now-playing'

/// JRD `properties` member names are URIs (RFC 7033 §4.4.4.5), so the source
/// id is keyed by one rather than a bare string.
export const ID_PROPERTY = 'https://frogpond.tech/ns/id'

/// Names the campus whose server a relative href resolves against. Absent
/// means the server that published the manifest. Published manifests say `carleton`, which the 2.9 RCs
/// read, so that spelling stays readable beside the campus id `edu.carleton`.
/// Read as a plain string, so a campus a build does not know leaves its entry
/// alone (as if absent) rather than failing the whole manifest.
export const CAMPUS_PROPERTY = 'https://frogpond.tech/ns/campus'

/// The campuses a relative href can resolve against, by campus id. Spelt out
/// here because a module cannot import the app's campus registry.
export type SourceCampus = 'edu.stolaf' | 'edu.carleton' | 'example.college'

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
	properties: z.object({
		[ID_PROPERTY]: z.string().min(1),
		[CAMPUS_PROPERTY]: z.string().min(1).optional(),
	}),
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
	/** The server a relative `href` resolves against. */
	campus: SourceCampus
}
