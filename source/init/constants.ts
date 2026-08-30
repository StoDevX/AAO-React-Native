import Constants from 'expo-constants'
import {setVersionInfo, setTimezone} from '@frogpond/constants'

export const SENTRY_DSN =
	'https://7f68e814c5c24c32a582f2ddc3d42b4c@o524787.ingest.sentry.io/5637838'

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
