import {ALTERNATE_ICON_FILES, addAlternateIcons} from '../with-alternate-icons'

describe('addAlternateIcons', () => {
	it('registers the windmill icon for iPhone', () => {
		let result = addAlternateIcons({})
		expect(
			result.CFBundleIcons.CFBundleAlternateIcons.icon_type_windmill,
		).toEqual({CFBundleIconFiles: ['windmill'], UIPrerenderedIcon: true})
	})

	it('registers the windmill icon for iPad', () => {
		let result = addAlternateIcons({})
		expect(
			result['CFBundleIcons~ipad'].CFBundleAlternateIcons.icon_type_windmill,
		).toEqual({CFBundleIconFiles: ['windmill'], UIPrerenderedIcon: true})
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
			'windmill@2x.png',
			'windmill@3x.png',
			'windmill@2x~iPad.png',
			'windmill@3x~iPad.png',
		])
	})
})
