import {describe, expect, it} from '@jest/globals'
import {appIcons, iconFor, previewsFor} from '../index'

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

describe('previewsFor', () => {
	it('shows the dark previews in dark mode', () => {
		expect(previewsFor('windmill-day', 'dark')).toBe(appIcons['windmill-day'].dark)
	})

	it.each(['light', 'unspecified', null, undefined])(
		'shows the light previews when the scheme is %s',
		(scheme) => {
			expect(previewsFor('windmill-day', scheme)).toBe(appIcons['windmill-day'].light)
		},
	)
})
