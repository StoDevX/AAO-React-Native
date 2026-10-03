import {formatVersion} from '../version'

describe('formatVersion', () => {
	it('shows the build number beside the version, as iOS does', () => {
		expect(formatVersion('2.8.0', '17')).toBe('2.8.0 (17)')
	})

	it('omits the parentheses when there is no build number', () => {
		expect(formatVersion('2.8.0', null)).toBe('2.8.0')
	})

	it('falls back when the native version is unavailable', () => {
		expect(formatVersion(null, '17')).toBe('unknown')
		expect(formatVersion(null, null)).toBe('unknown')
	})
})
