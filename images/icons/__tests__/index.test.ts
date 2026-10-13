import {readdirSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from '@jest/globals'
import {appIcons, iconFor, previewFor} from '../index'

/**
 * The names of the Icon Composer documents in assets/, and of those kept in
 * assets/0-source-icons/ only to render a static app icon set from.
 */
const DOCUMENTS = ['assets', 'assets/0-source-icons'].flatMap((dir) =>
	readdirSync(join(__dirname, '../../..', dir))
		.filter((entry) => entry.endsWith('.icon'))
		.map((entry) => entry.slice(0, -'.icon'.length)),
)

/** The names of the static app icon sets, each at assets/<name>.xcassets. */
const STATIC_SETS = readdirSync(join(__dirname, '../../..', 'assets'))
	.filter((entry) => entry.endsWith('.xcassets'))
	.map((entry) => entry.slice(0, -'.xcassets'.length))

describe('appIcons', () => {
	it('has previews for every Icon Composer document and static icon set', () => {
		let shipped = [...new Set([...DOCUMENTS, ...STATIC_SETS])]
		expect(Object.keys(appIcons).toSorted()).toEqual(shipped.toSorted())
	})
})

describe('iconFor', () => {
	it('reads the system default as the windmill', () => {
		expect(iconFor('Default')).toBe('windmill')
	})

	it.each(['old-main', 'windmill-sky'])('names the %s alternate', (name) => {
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

describe('previewFor', () => {
	it('shows the dark preview in dark mode', () => {
		expect(previewFor('windmill-sky', 'dark')).toBe(appIcons['windmill-sky'].dark)
	})

	it.each(['light', 'unspecified', null, undefined])(
		'shows the light preview when the scheme is %s',
		(scheme) => {
			expect(previewFor('windmill-sky', scheme)).toBe(appIcons['windmill-sky'].light)
		},
	)
})
