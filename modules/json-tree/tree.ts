/** One key of an object, or one index of an array, with what it holds. */
export interface JsonEntry {
	key: string
	value: unknown
}

/** Whether a value opens to show what it holds: an object or an array. */
export function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
	return typeof value === 'object' && value !== null
}

/** What an object or array holds: its keys in order, or its items by index. */
export function jsonEntries(value: Record<string, unknown> | unknown[]): JsonEntry[] {
	if (Array.isArray(value)) {
		return value.map((item, index) => ({key: String(index), value: item}))
	}
	return Object.entries(value).map(([key, item]) => ({key, value: item}))
}

/** A closed object or array as its row reads: how much it holds, in its own brackets. */
export function jsonSummary(value: Record<string, unknown> | unknown[]): string {
	return Array.isArray(value) ? `[${value.length}]` : `{${Object.keys(value).length}}`
}

/** A value that holds no others, as JSON writes it, with its kind for colour. */
export function jsonLeaf(value: unknown): {
	text: string
	kind: 'string' | 'number' | 'boolean' | 'null'
} {
	if (typeof value === 'string') {
		return {text: JSON.stringify(value), kind: 'string'}
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return {text: String(value), kind: typeof value === 'number' ? 'number' : 'boolean'}
	}
	return {text: 'null', kind: 'null'}
}

/// The most values a group can hold, all the way down, and still start open:
/// enough for a short object to read at a glance, few enough that a long one
/// stays a single row.
export const SMALL_GROUP = 12

/** How many values a group holds all the way down, counting no further than `limit + 1`. */
function valueCount(value: unknown, limit: number): number {
	if (!isContainer(value)) {
		return 1
	}
	let count = 0
	for (let item of Array.isArray(value) ? value : Object.values(value)) {
		count += valueCount(item, limit - count)
		if (count > limit) {
			break
		}
	}
	return count
}

/** Whether a group starts open: it holds no more than a few values, however deep. */
export function startsOpen(value: Record<string, unknown> | unknown[]): boolean {
	return valueCount(value, SMALL_GROUP) <= SMALL_GROUP
}

/// About the most of a value that fits beside its key on a phone.
const INLINE_LENGTH = 32

/**
 * Whether a value goes under its key, with the row to itself, rather than
 * beside it: a long one would be squeezed into a narrow column there. A string
 * holding line breaks reads as several lines, so it goes under too.
 */
export function stacksValue(text: string): boolean {
	return text.length > INLINE_LENGTH || text.includes('\\n')
}
