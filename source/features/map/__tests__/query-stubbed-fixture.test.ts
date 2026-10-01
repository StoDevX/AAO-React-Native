import {expect, jest, test} from '@jest/globals'

// What a release bundle carries in place of each map copy (metro.config.js).
jest.mock('../__fixtures__/maps', () => ({UITEST_MAPS: {stolaf: {}, carleton: {}}}))

import {mapDataOptions} from '../query'

test('a UI test on a bundle without its fixtures says why', async () => {
	let {queryFn} = mapDataOptions('stolaf')
	let context = {signal: new AbortController().signal} as Parameters<NonNullable<typeof queryFn>>[0]

	await expect(queryFn?.(context)).rejects.toThrow('KEEP_UITEST_FIXTURES=1')
})
