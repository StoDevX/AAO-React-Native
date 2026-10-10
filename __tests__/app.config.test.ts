import {execFileSync} from 'node:child_process'
import path from 'node:path'
import type {ExpoConfig} from 'expo/config'

/**
 * Load app.config.ts fresh for a given variant.
 *
 * It reads process.env at module scope, and it cannot import a helper from a
 * sibling file — Expo's config loader compiles it on its own and a relative
 * import throws `Cannot find module`. So the variant logic lives inline in the
 * config, and this is how it gets tested.
 */
function loadConfig(variant: string | undefined): ExpoConfig {
	jest.resetModules()
	if (variant === undefined) {
		delete process.env.APP_VARIANT
	} else {
		process.env.APP_VARIANT = variant
	}
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../app.config').default as ExpoConfig
}

afterEach(() => {
	delete process.env.APP_VARIANT
})

describe('app.config version', () => {
	function loadWithVersion(version: string): ExpoConfig {
		jest.resetModules()
		process.env.APP_VARIANT = 'aao'
		jest.doMock('../package.json', () => ({version}))
		// oxlint-disable-next-line typescript/no-require-imports
		return require('../app.config').default as ExpoConfig
	}

	// CFBundleShortVersionString takes the config's `version` verbatim, and
	// Apple rejects anything but dot-separated numbers -- so a prerelease tag
	// has to be stripped before it reaches the Info.plist.
	it.each([
		['2.8.0', '2.8.0'],
		['2.8.0-beta.3', '2.8.0'],
		['2.7.0-rc.1', '2.7.0'],
	])('turns %s into the shippable version %s', (input, shipped) => {
		expect(loadWithVersion(input).version).toBe(shipped)
	})

	// The prerelease tag still has to reach the JS side: setVersionInfo parses
	// it for the flags isDebugBuild reads.
	it.each(['2.8.0', '2.8.0-beta.3', '2.7.0-rc.1'])(
		'carries the full %s through for prerelease detection',
		(input) => {
			expect(loadWithVersion(input).extra?.fullVersion).toBe(input)
		},
	)
})

describe('app.config variants', () => {
	// Unset builds nothing, so a forgotten variant cannot launch the other app.
	it.each([undefined, ''])('refuses to build with APP_VARIANT %p', (variant) => {
		expect(() => loadConfig(variant)).toThrow(
			/APP_VARIANT is not set.*aao, aao-dev, carls, carls-dev/u,
		)
	})

	it('ships the real identity as aao', () => {
		let config = loadConfig('aao')
		expect(config.ios?.infoPlist?.CFBundleDisplayName).toBe('All About Olaf')
		expect(config.ios?.bundleIdentifier).toBe('NFMTHAZVS9.com.drewvolz.stolaf')
		expect(config.scheme).toBe('AllAboutOlaf')
	})

	// `name` also names the generated Xcode project, its target, its scheme and
	// its directory. It must not vary per variant: every plugin looks the
	// AllAboutAnything target up by name.
	it.each(['aao', 'aao-dev', 'carls', 'carls-dev'])(
		'keeps the Xcode project name fixed for %s',
		(variant) => {
			expect(loadConfig(variant).name).toBe('All About Anything')
		},
	)

	it.each([['aao-dev', '.dev', 'AAO Dev', 'AllAboutOlafDev']])(
		'gives %s its own identity',
		(variant, suffix, displayName, scheme) => {
			let config = loadConfig(variant)
			expect(config.ios?.bundleIdentifier).toBe(`NFMTHAZVS9.com.drewvolz.stolaf${suffix}`)
			expect(config.ios?.infoPlist?.CFBundleDisplayName).toBe(displayName)
			expect(config.scheme).toBe(scheme)
		},
	)

	// The home-screen name, not the icon, tells the variants apart.
	it.each(['aao', 'aao-dev'])('gives %s the Icon Composer windmill', (variant) => {
		expect(loadConfig(variant).ios?.icon).toBe('./assets/windmill.icon')
	})

	it('keeps every variant installable alongside the others', () => {
		let variants = ['aao', 'aao-dev', 'carls', 'carls-dev']
		let ids = variants.map((v) => loadConfig(v).ios?.bundleIdentifier)
		expect(new Set(ids).size).toBe(variants.length)
	})
})

describe('app.config CARLS', () => {
	// The CARLS app's own identifier and scheme, so the build updates CARLS on
	// the App Store and links made for it still open it.
	it.each([
		['carls', 'com.rives.carls', 'CARLS', 'carls'],
		['carls-dev', 'com.rives.carls.dev', 'CARLS Dev', 'carlsDev'],
	])('builds %s as CARLS', (variant, bundleIdentifier, displayName, scheme) => {
		let config = loadConfig(variant)
		expect(config.ios?.bundleIdentifier).toBe(bundleIdentifier)
		expect(config.ios?.infoPlist?.CFBundleDisplayName).toBe(displayName)
		expect(config.scheme).toBe(scheme)
		expect(config.extra?.app).toBe('carls')
	})

	it('wears the penguin, and bundles every other icon as an alternate', () => {
		let config = loadConfig('carls')
		expect(config.ios?.icon).toMatch(/carls-penguin/u)
		expect(config.plugins).toContainEqual([
			'./plugins/with-alternate-icons',
			{primary: 'carls-penguin'},
		])
		expect(config.extra?.primaryIcon).toBe('carls-penguin')
	})

	it.each(['aao', 'aao-dev'])('builds %s as All About Olaf', (variant) => {
		let config = loadConfig(variant)
		expect(config.extra?.app).toBe('aao')
		expect(config.plugins).toContainEqual(['./plugins/with-alternate-icons', {primary: 'windmill'}])
	})

	it('throws on an unrecognised variant rather than building another app', () => {
		expect(() => loadConfig('production')).toThrow(/"production"/u)
	})
})

describe('app.config calendar access', () => {
	// Adding an event goes through the system editor, which needs no access,
	// but expo-calendar links EventKit and App Store Connect rejects an upload
	// that links it without a calendar usage string (ITMS-90683). Its config
	// plugin adds usage strings even when unlisted, so this reads the
	// Info.plist Expo actually resolves -- plugins included -- rather than the
	// keys app.config.ts writes itself.
	it('ships the calendar usage string, and no reminders one', () => {
		let root = path.join(__dirname, '..')
		let env = {...process.env, APP_VARIANT: 'aao'}

		let output = execFileSync(
			process.execPath,
			[path.join(root, 'node_modules/expo/bin/cli'), 'config', '--type', 'introspect', '--json'],
			{cwd: root, env, encoding: 'utf8'},
		)
		let infoPlist = (JSON.parse(output) as ExpoConfig).ios?.infoPlist ?? {}

		expect(
			Object.keys(infoPlist)
				.filter((key) => /^NS(Calendars|Reminders)/u.test(key))
				.sort(),
		).toEqual(['NSCalendarsFullAccessUsageDescription', 'NSCalendarsUsageDescription'])
	}, 30_000)
})

describe('app.config link schemes', () => {
	// iOS answers canOpenURL "no" for any scheme the app has not declared, and
	// React Native turns that answer into a rejection. The call and email
	// helpers ask it whether the device can call or send mail at all.
	it('declares tel and mailto, so the app can ask whether it can call or email', () => {
		expect(loadConfig('aao').ios?.infoPlist?.LSApplicationQueriesSchemes).toEqual(
			expect.arrayContaining(['tel', 'mailto']),
		)
	})
})

describe('app.config default campus', () => {
	test("every variant's default campus is registered", () => {
		// oxlint-disable-next-line typescript/no-require-imports
		let {isCampusId} = require('../source/campuses') as typeof import('../source/campuses')
		for (let variant of ['aao', 'aao-dev', 'carls', 'carls-dev']) {
			expect(isCampusId(loadConfig(variant).extra?.defaultCampus)).toBe(true)
		}
	})
})
