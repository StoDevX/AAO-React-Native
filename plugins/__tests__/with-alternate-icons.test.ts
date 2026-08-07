import {ALTERNATE_ICON_FILES, addAlternateIcons} from '../with-alternate-icons'

describe('addAlternateIcons', () => {
	it('registers the Old Main icon for iPhone', () => {
		let result = addAlternateIcons({})
		expect(
			result.CFBundleIcons.CFBundleAlternateIcons.icon_type_old_main,
		).toEqual({CFBundleIconFiles: ['old-main'], UIPrerenderedIcon: true})
	})

	it('registers the Old Main icon for iPad', () => {
		let result = addAlternateIcons({})
		expect(
			result['CFBundleIcons~ipad'].CFBundleAlternateIcons.icon_type_old_main,
		).toEqual({CFBundleIconFiles: ['old-main'], UIPrerenderedIcon: true})
	})

	it('preserves unrelated keys', () => {
		let result = addAlternateIcons({CFBundleName: 'AllAboutOlaf'})
		expect(result.CFBundleName).toBe('AllAboutOlaf')
	})

	it('is idempotent', () => {
		let once = addAlternateIcons({})
		expect(addAlternateIcons(once)).toEqual(once)
	})
})

describe('ALTERNATE_ICON_FILES', () => {
	it('names every scale UIKit looks for, including the iPad variants', () => {
		expect(ALTERNATE_ICON_FILES).toEqual([
			'old-main@2x.png',
			'old-main@3x.png',
			'old-main@2x~iPad.png',
			'old-main@3x~iPad.png',
		])
	})
})
