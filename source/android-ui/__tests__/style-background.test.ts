import {describe, expect, test} from '@jest/globals'

import {backgroundColorOf} from '../style-background'

describe('backgroundColorOf', () => {
	test('reads a single style', () => {
		expect(backgroundColorOf({backgroundColor: 'red'})).toBe('red')
	})

	test('takes the last background in a list, as flattening does', () => {
		expect(backgroundColorOf([{backgroundColor: 'red'}, {backgroundColor: 'blue'}])).toBe('blue')
	})

	test('looks past later styles that set no background', () => {
		expect(backgroundColorOf([{backgroundColor: 'red'}, {padding: 4}])).toBe('red')
	})

	test('reads into nested lists, and skips empty entries', () => {
		expect(backgroundColorOf([[{backgroundColor: 'red'}, false], null, undefined, ''])).toBe('red')
	})

	test('has no background for no style', () => {
		expect(backgroundColorOf(undefined)).toBeUndefined()
		expect(backgroundColorOf([])).toBeUndefined()
	})
})
