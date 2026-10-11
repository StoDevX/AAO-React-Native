import Constants from 'expo-constants'
import {setVersionInfo, setTimezone} from '@frogpond/constants'

/** The build's Sentry DSN, which app.config.ts names per variant; undefined reports nothing. */
export const SENTRY_DSN: string | undefined =
	typeof Constants.expoConfig?.extra?.sentry?.dsn === 'string'
		? Constants.expoConfig.extra.sentry.dsn
		: undefined

/**
 * The full semver, prerelease tag and all, taken from the app config rather
 * than package.json.
 *
 * Metro inlines an imported JSON module whole, so importing package.json ships
 * every dependency name and script in the bundle. app.config.ts reads it at
 * build time and passes only this string through.
 */
const fullVersion = Constants.expoConfig?.extra?.fullVersion as string | undefined

setVersionInfo(fullVersion ?? '0.0.0')
setTimezone('America/Chicago')
