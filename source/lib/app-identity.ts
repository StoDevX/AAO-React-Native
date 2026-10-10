import Constants from 'expo-constants'

/** Which app a build is: All About Olaf, CARLS, or All About Anything. */
export type AppIdentity = 'aao' | 'carls' | 'aaa'

/** Whether `value` names an app. */
function isAppIdentity(value: unknown): value is AppIdentity {
	return value === 'aao' || value === 'carls' || value === 'aaa'
}

/**
 * The app this build is, as app.config.ts's `APP_VARIANT` chose it. Which
 * campus it opens on is DEFAULT_CAMPUS; dev mode switches campus in any.
 */
export const APP: AppIdentity = isAppIdentity(Constants.expoConfig?.extra?.app)
	? Constants.expoConfig.extra.app
	: 'aao'

/**
 * The campus a fresh install opens on, as app.config.ts's variant names it, or
 * null for a build that asks. Checked against the registry by the campus store.
 */
export const DEFAULT_CAMPUS: string | null =
	typeof Constants.expoConfig?.extra?.defaultCampus === 'string'
		? Constants.expoConfig.extra.defaultCampus
		: null

/** The primary icon's name, as app.config.ts's variant names it, or null in a build without one. */
export const PRIMARY_ICON: string | null =
	typeof Constants.expoConfig?.extra?.primaryIcon === 'string'
		? Constants.expoConfig.extra.primaryIcon
		: null
