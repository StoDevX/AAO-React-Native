import {describe, expect, it} from '@jest/globals'
import {DEFAULT_ICON, appIcons, iconFor} from '../../../../images/icons'
import {
	ICONS,
	currentIconEntry,
	galleryColumns,
	iconEntry,
	iconForCampus,
	iconsByGroup,
} from '../icons'

describe('ICONS', () => {
	it('lists every shipped icon exactly once', () => {
		let types = ICONS.map((icon) => icon.type)
		expect(types.toSorted()).toEqual(Object.keys(appIcons).toSorted())
		expect(new Set(types).size).toBe(types.length)
	})

	it('starts with the primary icon', () => {
		expect(ICONS[0]).toEqual({title: 'Big Ole', type: 'windmill', group: 'Classic'})
	})
})

describe('iconsByGroup', () => {
	it('orders the groups Classic, Windmill', () => {
		expect(iconsByGroup().map((g) => g.group)).toEqual(['Classic', 'Windmill'])
	})

	it('keeps Classic to Big Ole and the two Old Main icons', () => {
		expect(iconsByGroup()[0].icons.map((i) => i.type)).toEqual([
			'windmill',
			'old-main',
			'old-main-retro',
		])
	})

	it('gathers the windmill variants', () => {
		let windmills = iconsByGroup()[1].icons
		expect(windmills).toHaveLength(3)
		expect(windmills.every((i) => i.type.startsWith('windmill-'))).toBe(true)
	})
})

describe('iconFor', () => {
	it('shows the primary for the retired Stars icon', () => {
		expect(iconFor('windmill-stars')).toBe(DEFAULT_ICON)
	})
})

describe('iconEntry', () => {
	it('finds an icon by its type', () => {
		expect(iconEntry('windmill-dawn').title).toBe('Windmill (Dawn)')
	})
})

describe('currentIconEntry', () => {
	it('reads the system default as the primary', () => {
		expect(currentIconEntry('Default')).toBe(ICONS[0])
	})

	it('finds an alternate by its name', () => {
		expect(currentIconEntry('windmill-golden-hour').title).toBe('Windmill (Golden Hour)')
	})

	it('reads a name this build does not ship as the primary', () => {
		expect(currentIconEntry('icon_type_old_main')).toBe(ICONS[0])
	})
})

describe('galleryColumns', () => {
	// UIKit's font scales: Large is 1, xxxLarge about 1.35, AX1 1.65, AX2 1.94,
	// AX3 2.35, AX5 3.12.
	it.each([1, 1.35])('fits three icons across at a scale of %s', (scale) => {
		expect(galleryColumns(scale)).toBe(3)
	})

	it.each([1.65, 1.94])('drops to two at the first accessibility sizes (%s)', (scale) => {
		expect(galleryColumns(scale)).toBe(2)
	})

	it.each([2.35, 3.12])('drops to one at the largest sizes (%s)', (scale) => {
		expect(galleryColumns(scale)).toBe(1)
	})
})

describe('iconsByGroup on Carleton', () => {
	it('offers the CARLS icons alone', () => {
		expect(iconsByGroup('carleton')).toEqual([
			{group: 'CARLS', icons: [{title: 'Penguin', type: 'carls-penguin', group: 'CARLS'}]},
		])
	})

	it("keeps the CARLS icons out of St. Olaf's gallery", () => {
		let types = iconsByGroup('stolaf').flatMap((g) => g.icons.map((i) => i.type))
		expect(types).not.toContain('carls-penguin')
	})
})

describe('iconForCampus', () => {
	it('moves a St. Olaf icon to the penguin on Carleton', () => {
		expect(iconForCampus('windmill-dawn', 'carleton')).toBe('carls-penguin')
	})

	it('moves the penguin back to the primary on St. Olaf', () => {
		expect(iconForCampus('carls-penguin', 'stolaf')).toBe(DEFAULT_ICON)
	})

	it("keeps an icon of the campus's own", () => {
		expect(iconForCampus('old-main', 'stolaf')).toBeNull()
		expect(iconForCampus('carls-penguin', 'carleton')).toBeNull()
	})
})
