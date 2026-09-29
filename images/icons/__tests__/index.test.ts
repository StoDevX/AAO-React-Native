import {describe, expect, it} from '@jest/globals'
import {iconFor} from '../index'

describe('iconFor', () => {
	it('reads the system default as the windmill', () => {
		expect(iconFor('Default')).toBe('windmill')
	})

	it.each(['sunset-behind-main', 'windmill-day'])('names the %s alternate', (name) => {
		expect(iconFor(name)).toBe(name)
	})

	// An icon chosen under a name no longer shipped, like the old
	// `icon_type_old_main`.
	it('reads an unknown alternate as the windmill', () => {
		expect(iconFor('icon_type_old_main')).toBe('windmill')
	})

	it('does not mistake an inherited property for an icon', () => {
		expect(iconFor('toString')).toBe('windmill')
	})
})
