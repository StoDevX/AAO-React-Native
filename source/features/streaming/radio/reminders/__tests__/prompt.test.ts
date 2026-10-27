import {expect, test} from '@jest/globals'

import {promptFor} from '../prompt'

test('asks through iOS when it has never been asked', () => {
	expect(promptFor('undetermined')).toBe('ask')
})

test('sends the person to Settings once notifications are off', () => {
	expect(promptFor('denied')).toBe('settings')
})

test('asks nothing once notifications are allowed', () => {
	expect(promptFor('granted')).toBeNull()
})
