import Constants from 'expo-constants'

/** Which app a build is: All About Olaf, or CARLS. */
export type AppIdentity = 'aao' | 'carls'

/**
 * The app this build is, as app.config.ts's `APP_VARIANT` chose it. Which
 * campus it opens on is DEFAULT_CAMPUS; dev mode switches campus in either.
 */
export const APP: AppIdentity = Constants.expoConfig?.extra?.app === 'carls' ? 'carls' : 'aao'

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
