// @flow

import {Platform} from 'react-native'

let TZ: string
export const setTimezone = (zone: string) => (TZ = zone)
export const timezone = () => {
	if (!TZ) {
		throw new Error('timezone is not set')
	}

	return TZ
}

export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

let APP_VERSION: string
let APP_BUILD: ?string
export const appVersion = () => APP_VERSION
export const appBuild = () => APP_BUILD

let APP_NAME: string
export const setAppName = (name: string) => (APP_NAME = name)
export const appName = () => APP_NAME

let IS_BETA: boolean
export const isBeta = () => IS_BETA

let IS_ALPHA: boolean
export const isAlpha = () => IS_ALPHA

let IS_PRE: boolean
export const isPre = () => IS_PRE

let IS_RC: boolean
export const isRc = () => IS_RC

// checks if the build should show debugging tools
export const isDevMode = () =>
	!IS_PRODUCTION || (IS_ALPHA || IS_BETA || IS_PRE || IS_RC)

export const setVersionInfo = (versionStr: string) => {
	let [version, buildNum] = versionStr.split('+')

	APP_VERSION = version
	APP_BUILD = buildNum

	IS_ALPHA = version.includes('-alpha')
	IS_BETA = version.includes('-beta')
	IS_PRE = version.includes('-pre')
	IS_RC = version.includes('-rc')
}

export const userAgent = () => {
	const platformString =
		Platform.OS === 'ios'
			? 'iOS'
			: Platform.OS === 'android'
			? 'Android'
			: 'unknown'

	const platformVersion = Platform.Version || 'unknown'

	return `${APP_NAME}/${APP_VERSION} (${platformString}/${platformVersion})`
}
