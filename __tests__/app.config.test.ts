import type {ExpoConfig} from 'expo/config'

/**
 * Load app.config.ts fresh for a given variant.
 *
 * It reads process.env at module scope, and it cannot import a helper from a
 * sibling file — Expo's config loader compiles it on its own and a relative
 * import throws `Cannot find module`. So the variant logic lives inline in the
 * config, and this is how it gets tested.
 */
function loadConfig(variant?: string): ExpoConfig {
	jest.resetModules()
	if (variant === undefined) {
		delete process.env.APP_VARIANT
	} else {
		process.env.APP_VARIANT = variant
	}
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('../app.config').default as ExpoConfig
}

afterEach(() => {
	delete process.env.APP_VARIANT
})

describe('app.config variants', () => {
	it('ships the real identity when no variant is set', () => {
		let config = loadConfig()
		expect(config.ios?.infoPlist?.CFBundleDisplayName).toBe('All About Olaf')
		expect(config.ios?.bundleIdentifier).toBe('NFMTHAZVS9.com.drewvolz.stolaf')
		expect(config.scheme).toBe('AllAboutOlaf')
	})

	// `name` also names the generated Xcode project, its target, its scheme and
	// its directory. Varying it per variant produced AAODev.xcodeproj and broke
	// every plugin that looks for the AllAboutOlaf target.
	it.each(['production', 'development', 'preview'])(
		'keeps the Xcode project name fixed for %s',
		(variant) => {
			expect(loadConfig(variant).name).toBe('All About Olaf')
		},
	)

	it('is identical when the production variant is named explicitly', () => {
		expect(loadConfig('production')).toEqual(loadConfig())
	})

	it.each([
		['development', '.dev', 'AAO Dev', 'AllAboutOlafDev'],
		['preview', '.preview', 'AAO Preview', 'AllAboutOlafPreview'],
	])('gives %s its own identity', (variant, suffix, displayName, scheme) => {
		let config = loadConfig(variant)
		expect(config.ios?.bundleIdentifier).toBe(
			`NFMTHAZVS9.com.drewvolz.stolaf${suffix}`,
		)
		expect(config.ios?.infoPlist?.CFBundleDisplayName).toBe(displayName)
		expect(config.scheme).toBe(scheme)
	})

	it('keeps every variant installable alongside the others', () => {
		let ids = ['production', 'development', 'preview'].map(
			(v) => loadConfig(v).ios?.bundleIdentifier,
		)
		expect(new Set(ids).size).toBe(3)
	})

	it('throws on an unrecognised variant rather than shipping production', () => {
		expect(() => loadConfig('prodcution')).toThrow(/prodcution/u)
	})
})
