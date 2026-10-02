import type {Fault} from './faults'
import type {LineFile} from './line-file'

/** Where a run records every response it delivered. */
export const TAPE_FILE = 'chaos-tape.jsonl'

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
	return `${launch} ${method} ${url} #${occurrence}`
}

/** Counts the requests made to each method and URL in one launch. */
export class RequestCounter {
	private seen = new Map<string, number>()

	next(method: string, url: string): number {
		let id = `${method} ${url}`
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
