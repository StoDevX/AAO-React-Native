import {expect, jest, test} from '@jest/globals'

jest.mock('@frogpond/launch-arguments', () => ({fixtureMode: 'serve'}))
// What a release bundle carries in place of the fixture (metro.config.js).
jest.mock('../../__fixtures__/mess.json', () => ({}))

import {messFetch} from '../fixtures'

test('serving from a bundle without its fixture says why', async () => {
	let signal = new AbortController().signal
	await expect(messFetch('https://x/posts', signal, 'Mess')).rejects.toThrow(
		'KEEP_UITEST_FIXTURES=1',
	)
})
