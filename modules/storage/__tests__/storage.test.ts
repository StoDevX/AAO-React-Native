import {getItemAsArray, getItemAsBoolean, getItemAsString} from '../index'
import {describe, expect, test} from '@jest/globals'

describe('getItemAsBoolean', () => {
	test('returns fallback value', async () => {
		expect(await getItemAsBoolean('non-existent')).toBe(false)
	})
	test('returns overridden fallback value', async () => {
		expect(await getItemAsBoolean('non-existent', true)).toBe(true)
	})
})

describe('getItemAsString', () => {
	test('returns fallback value', async () => {
		expect(await getItemAsString('non-existent')).toBe('')
	})
	test('returns overridden fallback value', async () => {
		expect(await getItemAsString('non-existent', 'fallback')).toBe('fallback')
	})
})

describe('getItemAsArray', () => {
	test('returns fallback value', async () => {
		expect(await getItemAsArray('non-existent')).toStrictEqual([])
	})
	test('returns overridden fallback value', async () => {
		expect(await getItemAsArray('non-existent', ['fallback'])).toStrictEqual([
			'fallback',
		])
	})
})
