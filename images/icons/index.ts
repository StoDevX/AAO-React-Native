import type {ImageSourcePropType} from 'react-native'
import constellationIconDark from './constellation-icon-dark.png'
import constellationIcon from './constellation-icon.png'
import constellationLogoDark from './constellation-logo-dark.png'
import constellationLogo from './constellation-logo.png'
import sunsetBehindMainIconDark from './sunset-behind-main-icon-dark.png'
import sunsetBehindMainIcon from './sunset-behind-main-icon.png'
import sunsetBehindMainLogoDark from './sunset-behind-main-logo-dark.png'
import sunsetBehindMainLogo from './sunset-behind-main-logo.png'
import windmillDayIconDark from './windmill-day-icon-dark.png'
import windmillDayIcon from './windmill-day-icon.png'
import windmillDayLogoDark from './windmill-day-logo-dark.png'
import windmillDayLogo from './windmill-day-logo.png'
import windmillNightIconDark from './windmill-night-icon-dark.png'
import windmillNightIcon from './windmill-night-icon.png'
import windmillNightLogoDark from './windmill-night-logo-dark.png'
import windmillNightLogo from './windmill-night-logo.png'
import windmillAuroraIconDark from './windmill-aurora-icon-dark.png'
import windmillAuroraIcon from './windmill-aurora-icon.png'
import windmillAuroraLogoDark from './windmill-aurora-logo-dark.png'
import windmillAuroraLogo from './windmill-aurora-logo.png'
import windmillFogIconDark from './windmill-fog-icon-dark.png'
import windmillFogIcon from './windmill-fog-icon.png'
import windmillFogLogoDark from './windmill-fog-logo-dark.png'
import windmillFogLogo from './windmill-fog-logo.png'
import windmillSnowIconDark from './windmill-snow-icon-dark.png'
import windmillSnowIcon from './windmill-snow-icon.png'
import windmillSnowLogoDark from './windmill-snow-logo-dark.png'
import windmillSnowLogo from './windmill-snow-logo.png'
import windmillDawnIconDark from './windmill-dawn-icon-dark.png'
import windmillDawnIcon from './windmill-dawn-icon.png'
import windmillDawnLogoDark from './windmill-dawn-logo-dark.png'
import windmillDawnLogo from './windmill-dawn-logo.png'
import windmillStarsIconDark from './windmill-stars-icon-dark.png'
import windmillStarsIcon from './windmill-stars-icon.png'
import windmillStarsLogoDark from './windmill-stars-logo-dark.png'
import windmillStarsLogo from './windmill-stars-logo.png'
import windmillStormIconDark from './windmill-storm-icon-dark.png'
import windmillStormIcon from './windmill-storm-icon.png'
import windmillStormLogoDark from './windmill-storm-logo-dark.png'
import windmillStormLogo from './windmill-storm-logo.png'
import windmillGoldenHourIconDark from './windmill-golden-hour-icon-dark.png'
import windmillGoldenHourIcon from './windmill-golden-hour-icon.png'
import windmillGoldenHourLogoDark from './windmill-golden-hour-logo-dark.png'
import windmillGoldenHourLogo from './windmill-golden-hour-logo.png'
import windmillIconDark from './windmill-icon-dark.png'
import windmillIcon from './windmill-icon.png'
import windmillLogoDark from './windmill-logo-dark.png'
import windmillLogo from './windmill-logo.png'

type Previews = {
	/** The Settings picker's tile. */
	icon: ImageSourcePropType
	/** The Credits screen's logo. */
	logo: ImageSourcePropType
}

/**
 * Previews of each Icon Composer document in assets/, in its light and dark
 * renditions, rendered by `mise run icons`. The keys are the documents'
 * names, which are also what iOS reports as the alternate icon's name.
 */
export const appIcons = {
	windmill: {
		light: {icon: windmillIcon, logo: windmillLogo},
		dark: {icon: windmillIconDark, logo: windmillLogoDark},
	},
	'sunset-behind-main': {
		light: {icon: sunsetBehindMainIcon, logo: sunsetBehindMainLogo},
		dark: {icon: sunsetBehindMainIconDark, logo: sunsetBehindMainLogoDark},
	},
	'windmill-day': {
		light: {icon: windmillDayIcon, logo: windmillDayLogo},
		dark: {icon: windmillDayIconDark, logo: windmillDayLogoDark},
	},
	'windmill-night': {
		light: {icon: windmillNightIcon, logo: windmillNightLogo},
		dark: {icon: windmillNightIconDark, logo: windmillNightLogoDark},
	},
	'windmill-dawn': {
		light: {icon: windmillDawnIcon, logo: windmillDawnLogo},
		dark: {icon: windmillDawnIconDark, logo: windmillDawnLogoDark},
	},
	'windmill-storm': {
		light: {icon: windmillStormIcon, logo: windmillStormLogo},
		dark: {icon: windmillStormIconDark, logo: windmillStormLogoDark},
	},
	'windmill-golden-hour': {
		light: {icon: windmillGoldenHourIcon, logo: windmillGoldenHourLogo},
		dark: {icon: windmillGoldenHourIconDark, logo: windmillGoldenHourLogoDark},
	},
	'windmill-aurora': {
		light: {icon: windmillAuroraIcon, logo: windmillAuroraLogo},
		dark: {icon: windmillAuroraIconDark, logo: windmillAuroraLogoDark},
	},
	'windmill-fog': {
		light: {icon: windmillFogIcon, logo: windmillFogLogo},
		dark: {icon: windmillFogIconDark, logo: windmillFogLogoDark},
	},
	'windmill-snow': {
		light: {icon: windmillSnowIcon, logo: windmillSnowLogo},
		dark: {icon: windmillSnowIconDark, logo: windmillSnowLogoDark},
	},
	'windmill-stars': {
		light: {icon: windmillStarsIcon, logo: windmillStarsLogo},
		dark: {icon: windmillStarsIconDark, logo: windmillStarsLogoDark},
	},
	constellation: {
		light: {icon: constellationIcon, logo: constellationLogo},
		dark: {icon: constellationIconDark, logo: constellationLogoDark},
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
