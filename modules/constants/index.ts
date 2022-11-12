import {Platform} from 'react-native'

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
let APP_BUILD: string | undefined
export const appVersion: () => typeof APP_VERSION = () => APP_VERSION
export const appBuild: () => typeof APP_BUILD = () => APP_BUILD

let APP_NAME: string
export const setAppName: (s: string) => void = (name: string) =>
	(APP_NAME = name)
export const appName: () => typeof APP_NAME = () => APP_NAME

let IS_BETA: boolean
export const isBeta: () => typeof IS_BETA = () => IS_BETA

let IS_ALPHA: boolean
export const isAlpha: () => typeof IS_ALPHA = () => IS_ALPHA

let IS_PRE: boolean
export const isPre: () => typeof IS_PRE = () => IS_PRE

let IS_RC: boolean
export const isRc: () => typeof IS_RC = () => IS_RC

// checks if the build should show debugging tools
export const isDevMode: () => boolean = () =>
	!IS_PRODUCTION || IS_ALPHA || IS_BETA || IS_PRE || IS_RC

export const setVersionInfo: (s: string) => void = (versionStr: string) => {
	const [version, buildNum] = versionStr.split('+')

	APP_VERSION = version
	APP_BUILD = buildNum

	IS_ALPHA = version.includes('-alpha')
	IS_BETA = version.includes('-beta')
	IS_PRE = version.includes('-pre')
	IS_RC = version.includes('-rc')
}

export const userAgent: () => string = () => {
	const platformString =
		Platform.OS === 'ios'
			? 'iOS'
			: Platform.OS === 'android'
			? 'Android'
			: 'unknown'

	const platformVersion = Platform.Version || 'unknown'

	return `${APP_NAME}/${APP_VERSION} (${platformString}/${platformVersion})`
}
