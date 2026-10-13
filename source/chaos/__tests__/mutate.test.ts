import {mutateJson} from '../mutate'
import {seededRandom, type Random} from '../random'

/** The JSON type of `value`, telling arrays and null from objects. */
function typeOf(value: unknown): string {
	if (value === null) return 'null'
	if (Array.isArray(value)) return 'array'
	return typeof value
}

/** Every path in `value` outside an array, with the type found there. */
function shape(value: unknown, path = '$', out = new Map<string, string>()): Map<string, string> {
	out.set(path, typeOf(value))
	// An array's length is what a mutation may change, so its elements' paths are not compared.
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		for (let [key, child] of Object.entries(value)) {
			shape(child, `${path}.${key}`, out)
		}
	}
	return out
}

/** `mutateJson` with its two draws taken from `random`, as a fault takes them. */
function mutate(body: string, random: Random) {
	return mutateJson(body, random(), random())
}

const BODY = JSON.stringify({
	name: 'Stav Hall',
	open: true,
	capacity: 400,
	note: null,
	menus: [
		{label: 'Lunch', price: 7.5},
		{label: 'Dinner', price: 9},
	],
})

describe('mutateJson', () => {
	test('keeps every key and the type at every path', () => {
		let random = seededRandom(1)
		let before = shape(JSON.parse(BODY))
		for (let i = 0; i < 500; i++) {
			let mutation = mutate(BODY, random)
			if (!mutation) continue
			expect(shape(JSON.parse(mutation.body))).toEqual(before)
		}
	})

	test('changes the body, and names the path and the change', () => {
		let mutation = mutate(BODY, seededRandom(3))
		expect(mutation).not.toBeNull()
		expect(mutation?.body).not.toBe(BODY)
		expect(mutation?.path).toMatch(/^\$/u)
		expect(mutation?.change).toContain('→')
	})

	test('is the same for the same seed', () => {
		let a = seededRandom(7)
		let b = seededRandom(7)
		for (let i = 0; i < 50; i++) {
			expect(mutate(BODY, a)).toEqual(mutate(BODY, b))
		}
	})

	test('reaches arrays, strings, numbers and booleans', () => {
		let random = seededRandom(4)
		let changed = new Set<string>()
		for (let i = 0; i < 500; i++) {
			let path = mutate(BODY, random)?.path
			if (path) changed.add(path.replaceAll(/\[\d+\]/gu, '[]'))
		}
		expect(changed).toEqual(
			new Set(['$.name', '$.open', '$.capacity', '$.menus', '$.menus[].label', '$.menus[].price']),
		)
	})

	test('mutates a top-level array or scalar without changing its type', () => {
		let random = seededRandom(5)
		for (let body of ['[1,2,3]', '"ok"', '3', 'true']) {
			for (let i = 0; i < 20; i++) {
				let mutation = mutate(body, random)
				if (!mutation) continue
				expect(typeOf(JSON.parse(mutation.body))).toBe(typeOf(JSON.parse(body)))
			}
		}
	})

	test('leaves a body that is not JSON, or has nothing to change, alone', () => {
		let random = seededRandom(6)
		expect(mutate('<html></html>', random)).toBeNull()
		expect(mutate('', random)).toBeNull()
		expect(mutate('{}', random)).toBeNull()
		expect(mutate('null', random)).toBeNull()
		expect(mutate('{"a":null}', random)).toBeNull()
	})

	test('is decided by its two draws alone', () => {
		expect(mutateJson(BODY, 0, 0)).toEqual(mutateJson(BODY, 0, 0))
		expect(mutateJson(BODY, 0, 0)?.path).toBe('$.name')
		expect(mutateJson(BODY, 0, 0)?.change).toBe('"Stav Hall" → ""')
	})
})
