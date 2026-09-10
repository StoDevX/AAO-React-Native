import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ALTERNATE_ICON_FILES, addAlternateIcons} from './with-alternate-icons.ts'

describe('addAlternateIcons', () => {
	it('registers the Old Main icon for iPhone', () => {
		let result = addAlternateIcons({})
		assert.deepEqual(result.CFBundleIcons.CFBundleAlternateIcons.icon_type_old_main, {
			CFBundleIconFiles: ['old-main'],
			UIPrerenderedIcon: true,
		})
	})

	it('registers the Old Main icon for iPad', () => {
		let result = addAlternateIcons({})
		assert.deepEqual(result['CFBundleIcons~ipad'].CFBundleAlternateIcons.icon_type_old_main, {
			CFBundleIconFiles: ['old-main'],
			UIPrerenderedIcon: true,
		})
	})

	it('preserves unrelated keys', () => {
		let result = addAlternateIcons({CFBundleName: 'AllAboutOlaf'})
		assert.equal(result.CFBundleName, 'AllAboutOlaf')
	})

	it('is idempotent', () => {
		let once = addAlternateIcons({})
		assert.deepEqual(addAlternateIcons(once), once)
	})
})

describe('ALTERNATE_ICON_FILES', () => {
	it('names every scale UIKit looks for, including the iPad variants', () => {
		assert.deepEqual(ALTERNATE_ICON_FILES, [
			'old-main@2x.png',
			'old-main@3x.png',
			'old-main@2x~iPad.png',
			'old-main@3x~iPad.png',
		])
	})
})
