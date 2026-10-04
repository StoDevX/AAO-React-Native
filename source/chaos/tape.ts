import type {Fault} from './faults'
import type {LineFile} from './line-file'

/**
 * Where one launch records every response it delivered. Each launch has its
 * own, so a replay launch parses only its own answers rather than the whole
 * run's, which grows past a hundred megabytes in a long one.
 */
export function tapeFile(launch: number): string {
	return `chaos-tape-${launch}.jsonl`
}

/** One response as the app received it, after any fault. */
export type TapeEntry = {
	key: string
	status: number
	headers: Array<[string, string]>
	body: string
	delayMs: number
	/** Set when the request failed rather than answered. */
	error: 'network' | 'abort' | null
	fault: Fault['kind']
	/** Set when the body was left off the tape, so a replay fetches it again. */
	live?: boolean
	/** Which value a `mutated` fault changed, and how. */
	mutation?: {path: string; change: string}
	/** Set when a session's offline window failed the request. */
	offline?: true
	/** How long the window this request began lasts, on the request that began it. */
	offlineMs?: number
}

/**
 * Whether a response with this content type has a body the tape can hold.
 *
 * The tape holds text, and the app is handed a `Response` rebuilt from it. A
 * binary body cannot make that trip: React Native passes the string to native
 * code as a C string, which ends at the first NUL, so reading the rebuilt body
 * as bytes asks for more than native holds and crashes the app. The course
 * catalog, a SQLite file, is one such body.
 */
export function tapeHoldsBody(contentType: string | null): boolean {
	if (contentType === null) {
		return true
	}
	let type = contentType.split(';')[0].trim().toLowerCase()
	return (
		type.startsWith('text/') ||
		/(json|xml|javascript|ecmascript|yaml)$/u.test(type) ||
		type === 'application/x-www-form-urlencoded'
	)
}

/**
 * `url` with its cache-busting `_` query parameter removed, if it has one and
 * its value is all digits, so a request stamped with a fresh timestamp below
 * us still keys the same as the one we recorded it against. Every other
 * parameter, and its order, is kept; a URL this can't parse comes back as is.
 */
export function stableUrl(url: string): string {
	let parsed
	try {
		parsed = new URL(url)
	} catch {
		return url
	}
	if (/^\d+$/u.test(parsed.searchParams.get('_') ?? '')) {
		parsed.searchParams.delete('_')
	}
	let query = parsed.searchParams.toString()
	return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ''}${parsed.hash}`
}

/**
 * A request's place on the tape. Keyed by occurrence of its method and URL
 * rather than by global order, so requests that start in a different order on
 * replay still find their answers.
 */
export function requestKey(
	launch: number,
	method: string,
	url: string,
	occurrence: number,
): string {
	return `${launch} ${method} ${stableUrl(url)} #${occurrence}`
}

/** Counts the requests made to each method and URL in one launch. */
export class RequestCounter {
	private seen = new Map<string, number>()

	next(method: string, url: string): number {
		let id = `${method} ${stableUrl(url)}`
		let count = this.seen.get(id) ?? 0
		this.seen.set(id, count + 1)
		return count
	}
}

/** Every parseable record in `lines`; a line torn by a crash is skipped. */
export function parseLines<T>(lines: string[]): T[] {
	let parsed: T[] = []
	for (let line of lines) {
		if (!line.trim()) continue
		try {
			parsed.push(JSON.parse(line) as T)
		} catch {
			// A process killed mid-write leaves a partial last line.
		}
	}
	return parsed
}

/** The tape's entries by key. */
export function readTape(file: LineFile): Map<string, TapeEntry> {
	return new Map(parseLines<TapeEntry>(file.readLines()).map((entry) => [entry.key, entry]))
}
