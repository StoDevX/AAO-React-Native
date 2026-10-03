import {describe, expect, it} from '@jest/globals'
import {appIcons} from '../../../../images/icons'
import {ICONS, iconEntry, iconPosition, iconsByGroup} from '../icons'

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

describe('iconPosition', () => {
	it('places the system default first', () => {
		expect(iconPosition('Default')).toMatchObject({index: 0, total: 14})
		expect(iconPosition('Default').entry.type).toBe('windmill')
	})

	it('places an alternate by its gallery order', () => {
		let position = iconPosition('windmill-golden-hour')
		expect(position.entry.group).toBe('Windmill')
		expect(ICONS[position.index].type).toBe('windmill-golden-hour')
	})

	it('reads a name this build does not ship as the primary', () => {
		expect(iconPosition('icon_type_old_main').entry.type).toBe('windmill')
	})
})
