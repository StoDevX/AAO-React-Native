import {describe, expect, it} from '@jest/globals'
import appConfig from '../app.config'

describe('app.config.ts', () => {
	const config = appConfig

	it('declares app identity', () => {
		expect(config.name).toBe('All About Olaf')
		expect(config.slug).toBe('all-about-olaf')
		expect(config.scheme).toBe('AllAboutOlaf')
		expect(config.version).toBe('1.0.0')
	})

	it('declares iOS bundle identity', () => {
		expect(config.ios?.bundleIdentifier).toBe('NFMTHAZVS9.com.drewvolz.stolaf')
		expect(config.ios?.buildNumber).toBe('1')
		expect(config.ios?.supportsTablet).toBe(true)
	})

	it('declares encryption and deployment', () => {
		expect(config.ios?.config?.usesNonExemptEncryption).toBe(false)
	})

	it('preserves status bar style in Info.plist', () => {
		expect(config.ios?.infoPlist?.UIStatusBarStyle).toBe(
			'UIStatusBarStyleDarkContent',
		)
		expect(
			config.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance,
		).toBe(false)
	})

	it('preserves audio background mode', () => {
		expect(config.ios?.infoPlist?.UIBackgroundModes).toEqual(['audio'])
	})

	it('preserves ATS exceptions', () => {
		const ats = config.ios?.infoPlist?.NSAppTransportSecurity as
			| Record<string, unknown>
			| undefined
		expect(ats?.NSAllowsArbitraryLoadsInWebContent).toBe(true)
		expect(
			(ats?.NSExceptionDomains as Record<string, unknown>)?.localhost,
		).toEqual({NSTemporaryExceptionAllowsInsecureHTTPLoads: true})
	})

	it('preserves required device capabilities', () => {
		expect(config.ios?.infoPlist?.UIRequiredDeviceCapabilities).toEqual([
			'armv7',
		])
	})

	it('preserves supported orientations', () => {
		expect(config.ios?.infoPlist?.UISupportedInterfaceOrientations).toEqual([
			'UIInterfaceOrientationPortrait',
			'UIInterfaceOrientationLandscapeLeft',
			'UIInterfaceOrientationLandscapeRight',
		])
		expect(
			config.ios?.infoPlist?.['UISupportedInterfaceOrientations~ipad'],
		).toEqual([
			'UIInterfaceOrientationPortrait',
			'UIInterfaceOrientationPortraitUpsideDown',
			'UIInterfaceOrientationLandscapeLeft',
			'UIInterfaceOrientationLandscapeRight',
		])
	})

	it('starts with an empty plugins array (plugins added in later tasks)', () => {
		expect(config.plugins).toEqual([])
	})
})
