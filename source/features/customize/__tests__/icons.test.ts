import {describe, expect, it} from '@jest/globals'
import {appIcons} from '../../../../images/icons'
import {ICONS, currentIconEntry, iconEntry, iconsByGroup} from '../icons'

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
	it('puts Classic before Windmill and keeps gallery order within each', () => {
		let groups = iconsByGroup()
		expect(groups.map((g) => g.group)).toEqual(['Classic', 'Windmill'])
		expect(groups[0].icons.map((i) => i.type)).toEqual([
			'windmill',
			'sunset-behind-main',
			'old-main-hill',
			'old-main-retro',
			'constellation',
		])
		expect(groups[1].icons).toHaveLength(9)
		expect(groups[1].icons.every((i) => i.type.startsWith('windmill-'))).toBe(true)
	})
})

describe('iconEntry', () => {
	it('finds an icon by its type', () => {
		expect(iconEntry('windmill-fog').title).toBe('Windmill (Fog)')
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
