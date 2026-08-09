import {getAtKeyPath} from '../get-at-key-path'

describe('getAtKeyPath', () => {
	test('returns the original state unchanged for an empty keyPath', () => {
		let state = {settings: {devMode: true}}

		expect(getAtKeyPath(state, [])).toBe(state)
	})

	test('walks into a nested object via a string key', () => {
		let state = {settings: {devMode: true}}

		expect(getAtKeyPath(state, ['settings', 'devMode'])).toBe(true)
	})

	test('walks into an array via a numeric-string index', () => {
		let state = {items: ['first', 'second', 'third']}

		expect(getAtKeyPath(state, ['items', '1'])).toBe('second')
	})

	test('returns undefined for a missing key partway through the path', () => {
		let state = {settings: {devMode: true}}

		expect(getAtKeyPath(state, ['settings', 'nope'])).toBeUndefined()
	})

	test('returns undefined for a key on a primitive value', () => {
		let state = {settings: {devMode: true}}

		expect(getAtKeyPath(state, ['settings', 'devMode', 'nope'])).toBeUndefined()
	})

	test('short-circuits to undefined when a null value is encountered mid-path', () => {
		let state = {settings: null}

		expect(getAtKeyPath(state, ['settings', 'devMode'])).toBeUndefined()
	})

	test('short-circuits to undefined when an undefined value is encountered mid-path', () => {
		let state = {settings: undefined}

		expect(getAtKeyPath(state, ['settings', 'devMode'])).toBeUndefined()
	})

	test('returns undefined for a non-numeric string key against an array', () => {
		let state = {items: ['first', 'second', 'third']}

		expect(getAtKeyPath(state, ['items', 'nope'])).toBeUndefined()
	})
})
