import type {ImageSourcePropType} from 'react-native'
import constellationLogoDark from './constellation-logo-dark.png'
import constellationLogo from './constellation-logo.png'
import oldMainRetroLogoDark from './old-main-retro-logo-dark.png'
import oldMainRetroLogo from './old-main-retro-logo.png'
import oldMainHillLogoDark from './old-main-hill-logo-dark.png'
import oldMainHillLogo from './old-main-hill-logo.png'
import sunsetBehindMainLogoDark from './sunset-behind-main-logo-dark.png'
import sunsetBehindMainLogo from './sunset-behind-main-logo.png'
import windmillSkyLogoDark from './windmill-sky-logo-dark.png'
import windmillSkyLogo from './windmill-sky-logo.png'
import windmillNightLogoDark from './windmill-night-logo-dark.png'
import windmillNightLogo from './windmill-night-logo.png'
import windmillAuroraLogoDark from './windmill-aurora-logo-dark.png'
import windmillAuroraLogo from './windmill-aurora-logo.png'
import windmillFogLogoDark from './windmill-fog-logo-dark.png'
import windmillFogLogo from './windmill-fog-logo.png'
import windmillDawnLogoDark from './windmill-dawn-logo-dark.png'
import windmillDawnLogo from './windmill-dawn-logo.png'
import windmillStarsLogoDark from './windmill-stars-logo-dark.png'
import windmillStarsLogo from './windmill-stars-logo.png'
import windmillGoldenHourLogoDark from './windmill-golden-hour-logo-dark.png'
import windmillGoldenHourLogo from './windmill-golden-hour-logo.png'
import windmillLogoDark from './windmill-logo-dark.png'
import windmillLogo from './windmill-logo.png'

type Previews = {
	/**
	 * The Credits screen's logo and the App Icon gallery's tile, which the
	 * Customize sheet's App Icon row scales down.
	 */
	logo: ImageSourcePropType
}

/**
 * Previews of each Icon Composer document in assets/, in its light and dark
 * renditions, rendered by `mise run icons`. The keys are the documents'
 * names, which are also what iOS reports as the alternate icon's name.
 */
export const appIcons = {
	windmill: {
		light: {logo: windmillLogo},
		dark: {logo: windmillLogoDark},
	},
	'sunset-behind-main': {
		light: {logo: sunsetBehindMainLogo},
		dark: {logo: sunsetBehindMainLogoDark},
	},
	'old-main-hill': {
		light: {logo: oldMainHillLogo},
		dark: {logo: oldMainHillLogoDark},
	},
	'old-main-retro': {
		light: {logo: oldMainRetroLogo},
		dark: {logo: oldMainRetroLogoDark},
	},
	'windmill-sky': {
		light: {logo: windmillSkyLogo},
		dark: {logo: windmillSkyLogoDark},
	},
	'windmill-night': {
		light: {logo: windmillNightLogo},
		dark: {logo: windmillNightLogoDark},
	},
	'windmill-dawn': {
		light: {logo: windmillDawnLogo},
		dark: {logo: windmillDawnLogoDark},
	},
	'windmill-golden-hour': {
		light: {logo: windmillGoldenHourLogo},
		dark: {logo: windmillGoldenHourLogoDark},
	},
	'windmill-aurora': {
		light: {logo: windmillAuroraLogo},
		dark: {logo: windmillAuroraLogoDark},
	},
	'windmill-fog': {
		light: {logo: windmillFogLogo},
		dark: {logo: windmillFogLogoDark},
	},
	'windmill-stars': {
		light: {logo: windmillStarsLogo},
		dark: {logo: windmillStarsLogoDark},
	},
	constellation: {
		light: {logo: constellationLogo},
		dark: {logo: constellationLogoDark},
	},
} satisfies Record<string, {light: Previews; dark: Previews}>

export type AppIconName = keyof typeof appIcons

/** The primary icon, which `ios.icon` names in app.config.ts. */
export const DEFAULT_ICON: AppIconName = 'windmill'

/**
 * Which icon to show for the name `getIcon()` reports: "Default" for the
 * primary, else the alternate's name. Any name this build does not ship reads
 * as the primary.
 */
export function iconFor(systemName: string): AppIconName {
	return Object.hasOwn(appIcons, systemName) ? (systemName as AppIconName) : DEFAULT_ICON
}

/** The previews matching the app's appearance, from `useColorScheme()`. */
export function previewsFor(name: AppIconName, scheme: string | null | undefined): Previews {
	return scheme === 'dark' ? appIcons[name].dark : appIcons[name].light
}
