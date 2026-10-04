import {describe, expect, it} from '@jest/globals'
import {keepsDarkMode} from '../photo-story'

const PHOTO = {section: 'Variety', column: 'Photo'}

describe('keepsDarkMode', () => {
	it('keeps a Variety › Photo story dark while the setting is on', () => {
		expect(keepsDarkMode(PHOTO, true)).toBe(true)
	})

	it('lets a Photo story follow the system once the setting is off', () => {
		expect(keepsDarkMode(PHOTO, false)).toBe(false)
	})

	it('leaves another Variety column alone', () => {
		expect(keepsDarkMode({section: 'Variety', column: 'Poetry'}, true)).toBe(false)
	})

	it('leaves a story with no column alone', () => {
		expect(keepsDarkMode({section: 'News', column: null}, true)).toBe(false)
	})
})
