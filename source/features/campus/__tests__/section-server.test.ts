import {expect, test} from '@jest/globals'

import {sectionServer} from '../section-server'

test("a section naming no server fetches from its own campus's", () => {
	expect(sectionServer('edu.carleton', {})).toBe('edu.carleton')
	expect(sectionServer('edu.carleton', undefined)).toBe('edu.carleton')
})

test('a section naming a server fetches from that one', () => {
	expect(sectionServer('edu.carleton', {server: 'edu.stolaf'})).toBe('edu.stolaf')
})
