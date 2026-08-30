import {describe, expect, test} from '@jest/globals'

import {displayP3} from '../display-p3'
import * as gradients from '../gradients'

const SAMPLED_NAMES = [
	'redGradient',
	'orangeGradient',
	'goldGradient',
	'yellowGradient',
	'greenGradient',
	'mintGradient',
	'lightBlueGradient',
	'blueGradient',
	'indigoGradient',
	'purpleGradient',
	'violetGradient',
	'pinkGradient',
	'grayGradient',
	'sageGradient',
	'tanGradient',
]

const DERIVED_NAMES = ['paleGoldGradient']

const EXPECTED_NAMES = [...SAMPLED_NAMES, ...DERIVED_NAMES]

describe('gradients', () => {
	test('exports exactly the named gradients', () => {
		let exportedNames = Object.keys(gradients).filter((k) => k !== 'Gradient')
		expect(exportedNames.sort()).toEqual([...EXPECTED_NAMES].sort())
	})

	test('every gradient is an [inner, outer] pair of Display P3 colors', () => {
		for (let name of EXPECTED_NAMES) {
			let value = (gradients as Record<string, unknown>)[name]
			expect(Array.isArray(value)).toBe(true)
			expect((value as string[]).length).toBe(2)
			for (let color of value as string[]) {
				// Parsing it is a stronger check than matching a shape: these have to
				// survive the conversion that actually renders them, and a hex value
				// that slipped in would be rejected rather than quietly treated as
				// sRGB.
				expect(() => displayP3(color)).not.toThrow()
			}
		}
	})
})
