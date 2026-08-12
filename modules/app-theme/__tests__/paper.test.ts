import {CombinedLightTheme, CombinedDarkTheme} from '../paper'

describe('CombinedLightTheme / CombinedDarkTheme', () => {
	it('merges Paper MD3 theme properties into the light theme', () => {
		expect(CombinedLightTheme.colors).toHaveProperty('primary')
	})

	it('merges React Navigation theme properties into the light theme', () => {
		expect(CombinedLightTheme.colors).toHaveProperty('card')
	})

	it('merges both into the dark theme too', () => {
		expect(CombinedDarkTheme.colors).toHaveProperty('primary')
		expect(CombinedDarkTheme.colors).toHaveProperty('card')
	})

	it('marks the dark theme as dark', () => {
		expect(CombinedDarkTheme.dark).toBe(true)
	})
})
