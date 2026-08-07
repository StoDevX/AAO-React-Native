let TZ: string
export const setTimezone: (s: string) => void = (zone: string) => (TZ = zone)
export const timezone: () => typeof TZ = () => {
	if (!TZ) {
		throw new Error('timezone is not set')
	}

	return TZ
}

export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

let APP_VERSION: string
export const appVersion: () => typeof APP_VERSION = () => APP_VERSION

// Set from a prerelease tag in the package.json version -- "2.8.0-beta.3" and
// "2.7.0-rc.1" are both real releases of this app. They exist because
// IS_PRODUCTION is only `NODE_ENV === 'production'`, which is true of any
// release bundle, TestFlight beta and App Store alike. These are what let a
// beta keep its debugging affordances while a store build does not.
//
// Read by isDebugBuild below, and by nothing else.
let IS_BETA = false
let IS_ALPHA = false
let IS_PRE = false
let IS_RC = false

// checks if the build should show debugging tools. build-time only — use
// useIsDevMode() from source/lib for React-tree callers that should also
// honor the runtime override.
export const isDebugBuild: () => boolean = () =>
	!IS_PRODUCTION || IS_ALPHA || IS_BETA || IS_PRE || IS_RC

export const setVersionInfo: (s: string) => void = (versionStr: string) => {
	const [version] = versionStr.split('+')

	APP_VERSION = version

	IS_ALPHA = version.includes('-alpha')
	IS_BETA = version.includes('-beta')
	IS_PRE = version.includes('-pre')
	IS_RC = version.includes('-rc')
}
