import {GRADIENT_NAMES} from '@frogpond/colors'
import bundled from '../../../../../docs/student-work-areas.json'

type Entry = {name: string; slug: string; icon: string; gradient: string; units: string[]}
const areas = (bundled as {data: Entry[]}).data

describe('student-work-areas.yaml', () => {
	test('lists the sixteen tiles', () => {
		expect(areas).toHaveLength(16)
	})

	test('gives every area its own slug', () => {
		let slugs = areas.map((area) => area.slug)
		expect(new Set(slugs).size).toBe(slugs.length)
	})

	// The Area filter lists areas by name, and turns a chosen name back into
	// its slug; two areas sharing a name would be one option choosing both.
	test('gives every area its own name', () => {
		let names = areas.map((area) => area.name)
		expect(new Set(names).size).toBe(names.length)
	})

	// A unit under two areas would count its postings twice on the landing.
	test('puts every unit under one area only', () => {
		let units = areas.flatMap((area) => area.units)
		expect(new Set(units).size).toBe(units.length)
	})

	test('uses only five-digit unit numbers', () => {
		for (let unit of areas.flatMap((area) => area.units)) {
			expect(unit).toMatch(/^\d{5}$/u)
		}
	})

	test('uses only named gradients', () => {
		for (let area of areas) {
			expect(GRADIENT_NAMES).toContain(area.gradient)
		}
	})
})
