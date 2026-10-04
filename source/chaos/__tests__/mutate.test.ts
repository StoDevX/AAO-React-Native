import {mutateJson} from '../mutate'
import {seededRandom} from '../random'

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
			let mutation = mutateJson(BODY, random)
			if (!mutation) continue
			expect(shape(JSON.parse(mutation.body))).toEqual(before)
		}
	})

	test('changes the body, and names the path and the change', () => {
		let mutation = mutateJson(BODY, seededRandom(3))
		expect(mutation).not.toBeNull()
		expect(mutation?.body).not.toBe(BODY)
		expect(mutation?.path).toMatch(/^\$/u)
		expect(mutation?.change).toContain('→')
	})

	test('is the same for the same seed', () => {
		let a = seededRandom(7)
		let b = seededRandom(7)
		for (let i = 0; i < 50; i++) {
			expect(mutateJson(BODY, a)).toEqual(mutateJson(BODY, b))
		}
	})

	test('reaches arrays, strings, numbers and booleans', () => {
		let random = seededRandom(4)
		let changed = new Set<string>()
		for (let i = 0; i < 500; i++) {
			let path = mutateJson(BODY, random)?.path
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
				let mutation = mutateJson(body, random)
				if (!mutation) continue
				expect(typeOf(JSON.parse(mutation.body))).toBe(typeOf(JSON.parse(body)))
			}
		}
	})

	test('leaves a body that is not JSON, or has nothing to change, alone', () => {
		let random = seededRandom(6)
		expect(mutateJson('<html></html>', random)).toBeNull()
		expect(mutateJson('', random)).toBeNull()
		expect(mutateJson('{}', random)).toBeNull()
		expect(mutateJson('null', random)).toBeNull()
		expect(mutateJson('{"a":null}', random)).toBeNull()
	})

	test('draws twice from random for any JSON body, so the next fault is the same either way', () => {
		let draws = 0
		let counting = () => {
			draws++
			return 0.5
		}
		mutateJson('{}', counting)
		expect(draws).toBe(2)
		draws = 0
		mutateJson(BODY, counting)
		expect(draws).toBe(2)
	})
})
