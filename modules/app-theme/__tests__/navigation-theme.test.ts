import {DarkTheme, LightTheme} from '../navigation-theme'

describe('LightTheme / DarkTheme', () => {
	it('marks only the dark theme as dark', () => {
		expect(LightTheme.dark).toBe(false)
		expect(DarkTheme.dark).toBe(true)
	})
})
