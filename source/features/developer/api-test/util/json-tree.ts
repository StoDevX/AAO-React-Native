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
