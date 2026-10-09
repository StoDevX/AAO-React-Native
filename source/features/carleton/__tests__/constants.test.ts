import {describe, expect, test} from '@jest/globals'
import type {EventType} from '@frogpond/event-type'

import {sumoEventMapper} from '../constants'

function withTitle(title: string): EventType {
	return {title} as EventType
}

describe('sumoEventMapper', () => {
	test.each([
		['SUMO Movie: I Love Boosters', 'I Love Boosters'],
		['SUMO: My Neighbor Totoro', 'My Neighbor Totoro'],
		['Song of the Sea', 'Song of the Sea'],
	])('titles %p as %p', (title, expected) => {
		expect(sumoEventMapper(withTitle(title)).title).toBe(expected)
	})
})
