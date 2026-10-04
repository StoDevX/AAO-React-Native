import {describe, expect, test} from '@jest/globals'

import {parseBody} from '../parse-body'

describe('parseBody', () => {
	test('parses a JSON body', () => {
		expect(parseBody('{"a":[1,2]}')).toEqual({kind: 'json', value: {a: [1, 2]}})
	})

	test('reports an empty body as empty', () => {
		expect(parseBody('')).toEqual({kind: 'empty'})
		expect(parseBody('   \n')).toEqual({kind: 'empty'})
	})

	test('keeps a body that is not JSON as text', () => {
		expect(parseBody('<html>nope</html>')).toEqual({kind: 'text', text: '<html>nope</html>'})
	})

	test('keeps a truncated JSON body as text', () => {
		expect(parseBody('{"a":[1,')).toEqual({kind: 'text', text: '{"a":[1,'})
	})
})
