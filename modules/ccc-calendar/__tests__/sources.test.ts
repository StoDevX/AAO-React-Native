import {describe, expect, test} from '@jest/globals'

import {REMOTE_SOURCES} from '../sources'

describe('calendar sources', () => {
	test('the app ships one remote source', () => {
		// In UI testing mode (Jest), the source is 'uitest'
		expect(REMOTE_SOURCES.map((s) => s.id)).toEqual(['uitest'])
	})
})
