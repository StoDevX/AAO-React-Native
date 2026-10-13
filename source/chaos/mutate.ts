/** A body after one of its values was changed, and which one and how. */
export type Mutation = {body: string; path: string; change: string}

type Json = null | boolean | number | string | Json[] | {[key: string]: Json}

/** A value in the parsed body, where it is, and how to replace it. */
type Slot = {path: string; value: Json; replace: (next: Json) => void}

/** Text that has broken text handling before: nothing, very long, emoji, right-to-left, combining marks. */
const STRINGS = ['', 'lefse '.repeat(400), '👩🏽‍🔬🏳️‍🌈', 'مرحبا بالعالم', 'Z̤͔ͧ̑a̮l͖g̘o']

/** Numbers a server could send that a screen may not expect. */
const NUMBERS = [0, -1, 2_147_483_647]

/** How many elements a lengthened array is given. */
const LONG_ARRAY = 200

/** `path` extended by an object's `key`, bracketed when it is not an identifier. */
function keyPath(path: string, key: string): string {
	return /^[A-Za-z_$][\w$]*$/u.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`
}

/** Every array, string, number and boolean in `value`, outermost first. */
function slotsIn(value: Json, path: string, replace: Slot['replace'], out: Slot[]): Slot[] {
	if (value === null) {
		return out
	}
	if (Array.isArray(value)) {
		out.push({path, value, replace})
		value.forEach((item, index) => {
			slotsIn(item, `${path}[${index}]`, (next) => (value[index] = next), out)
		})
		return out
	}
	if (typeof value === 'object') {
		for (let key of Object.keys(value)) {
			slotsIn(value[key], keyPath(path, key), (next) => (value[key] = next), out)
		}
		return out
	}
	out.push({path, value, replace})
	return out
}

/** `value`'s replacement, chosen by `roll` in [0, 1): the same type, a different value. */
function variant(value: Json, roll: number): Json {
	if (Array.isArray(value)) {
		let long =
			value.length === 0
				? []
				: Array.from(
						{length: LONG_ARRAY},
						(_, i) => JSON.parse(JSON.stringify(value[i % value.length])) as Json,
					)
		let choices: Json[][] = [[], value.slice(0, 1), long]
		return choices[Math.floor(roll * choices.length)]
	}
	if (typeof value === 'string') {
		return STRINGS[Math.floor(roll * STRINGS.length)]
	}
	if (typeof value === 'number') {
		return NUMBERS[Math.floor(roll * NUMBERS.length)]
	}
	return !value
}

/** `value` in a few characters, for the finding that names a change. */
function brief(value: Json): string {
	if (Array.isArray(value)) {
		return `array(${value.length})`
	}
	let text = JSON.stringify(value)
	return text.length > 24 ? `${text.slice(0, 23)}…` : text
}

/**
 * `body` with one array, string, number or boolean changed to another value of
 * the same type, or null when it is not JSON, holds nothing to change, or the
 * change chosen would leave it as it was. `pick` and `roll`, each in [0, 1),
 * choose the value and its replacement.
 */
export function mutateJson(body: string, pick: number, roll: number): Mutation | null {
	let root: {value: Json}
	try {
		root = {value: JSON.parse(body) as Json}
	} catch {
		return null
	}
	let slots = slotsIn(root.value, '$', (next) => (root.value = next), [])
	if (slots.length === 0) {
		return null
	}
	let slot = slots[Math.floor(pick * slots.length)]
	let next = variant(slot.value, roll)
	if (JSON.stringify(next) === JSON.stringify(slot.value)) {
		return null
	}
	let change = `${brief(slot.value)} → ${brief(next)}`
	slot.replace(next)
	return {body: JSON.stringify(root.value), path: slot.path, change}
}
