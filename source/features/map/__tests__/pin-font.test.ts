import {describe, expect, test} from '@jest/globals'

import {campusById} from '../../../campuses'
import {pinNameLayout} from '../map-pins-layer'

describe("a pin's name", () => {
	test("is set in Noto Sans, which St. Olaf's and Carleton's basemaps serve", () => {
		expect(pinNameLayout(undefined)?.['text-font']).toEqual(['Noto Sans Medium'])
	})

	// A font the basemap does not serve 404s, and the pins' tiles then never finish: the pins vanish,
	// and a tap meant for one lands on the building under it.
	test('is set in the font a campus names for its basemap', () => {
		expect(pinNameLayout('Open Sans Semibold')?.['text-font']).toEqual(['Open Sans Semibold'])
	})

	test("is set on Wiki Monkeys' demo basemap in a font that basemap serves", () => {
		expect(campusById('example.college').map?.labelFont).toBe('Open Sans Semibold')
	})
})
