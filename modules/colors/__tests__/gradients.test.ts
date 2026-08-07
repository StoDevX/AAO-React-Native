import {describe, expect, test} from '@jest/globals'

import * as gradients from '../gradients'

const EXPECTED_NAMES = [
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

describe('gradients', () => {
	test('exports exactly the 15 named gradients', () => {
		let exportedNames = Object.keys(gradients).filter((k) => k !== 'Gradient')
		expect(exportedNames.sort()).toEqual([...EXPECTED_NAMES].sort())
	})

	test('every gradient is a [left, right] pair of hex colors', () => {
		for (let name of EXPECTED_NAMES) {
			let value = (gradients as Record<string, unknown>)[name]
			expect(Array.isArray(value)).toBe(true)
			expect((value as string[]).length).toBe(2)
			for (let color of value as string[]) {
				expect(color).toMatch(/^#[0-9a-f]{6}$/iu)
			}
		}
	})
})
