import {describe, expect, it} from '@jest/globals'
import {appIcons} from '../../../../images/icons'
import {ICONS, currentIconEntry, galleryColumns, iconEntry, iconsByGroup} from '../icons'

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
	it('orders the groups Classic, Old Main, Windmill', () => {
		expect(iconsByGroup().map((g) => g.group)).toEqual(['Classic', 'Old Main', 'Windmill'])
	})

	it('keeps Classic to Big Ole', () => {
		expect(iconsByGroup()[0].icons.map((i) => i.type)).toEqual(['windmill'])
	})

	it('gathers the three Old Main icons', () => {
		expect(iconsByGroup()[1].icons.map((i) => i.type)).toEqual([
			'sunset-behind-main',
			'old-main-hill',
			'old-main-retro',
		])
	})

	it('gathers the windmill variants', () => {
		let windmills = iconsByGroup()[2].icons
		expect(windmills).toHaveLength(4)
		expect(windmills.every((i) => i.type.startsWith('windmill-'))).toBe(true)
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
