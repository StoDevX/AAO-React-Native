import {describe, expect, test} from '@jest/globals'

import {streamsOptionsFor} from '../query'

describe('streamsOptionsFor', () => {
	// The window starts on the app's day, not the device's, so a frozen or
	// overridden clock asks for the same streams on any day it runs.
	test("asks for two months of streams from the app clock's day", () => {
		expect(streamsOptionsFor().queryKey).toEqual([
			'streams',
			{sort: 'ascending', dateFrom: '2026-09-05', dateTo: '2026-11-05'},
		])
	})
})
