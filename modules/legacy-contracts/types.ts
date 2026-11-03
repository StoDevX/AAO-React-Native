import type {z} from 'zod'

/** How a release reads a response body. */
export type ResponseFormat = 'json' | 'html' | 'xml' | 'text'

/**
 * One request a shipped release makes, and what that release needs from the
 * answer. The response schema holds only what the release reads: objects are
 * loose, so a server may add fields, but a field the schema requires must stay,
 * with the type the schema gives it.
 */
export type Contract = {
	/** A short name, unique within its release, such as `building-hours`. */
	name: string
	method: 'GET' | 'POST'
	/**
	 * The URL as the release builds it, query string included. A part filled in
	 * at runtime is written `{name}`.
	 */
	url: string
	/** The values a `{name}` in `url` takes, when the release fixes them. */
	params?: Record<string, readonly string[]>
	format: ResponseFormat
	/** Where the release makes the request: `path:line` in the tagged tree. */
	source: readonly string[]
	/** The body the release sends, for a POST. */
	request?: z.ZodType
	/** What the release reads from the response. */
	response: z.ZodType
	/** What happens when the request fails, and anything else worth knowing. */
	notes?: string
}

/** The final build of one minor version, and every request it makes. */
export type Release = {
	/** The git tag the contracts were read from. */
	tag: string
	/** `version` in the tag's package.json. */
	version: string
	contracts: readonly Contract[]
}
