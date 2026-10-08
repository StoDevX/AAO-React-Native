import Constants from 'expo-constants'

/** Which app a build is: All About Olaf, or CARLS. */
export type AppIdentity = 'aao' | 'carls'

/**
 * The app this build is, as app.config.ts's `APP_VARIANT` chose it. CARLS is
 * fixed to Carleton; All About Olaf starts at St. Olaf and switches in dev mode.
 */
export const APP: AppIdentity = Constants.expoConfig?.extra?.app === 'carls' ? 'carls' : 'aao'
