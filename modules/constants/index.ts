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

// Prerelease flags, read only by isDebugBuild below.
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
