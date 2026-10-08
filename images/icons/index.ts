import type {ImageSourcePropType} from 'react-native'
import lionDark from './lion-dark.png'
import lion from './lion.png'
import oIsForOlafDark from './o-is-for-olaf-dark.png'
import oIsForOlaf from './o-is-for-olaf.png'
import oldMainRetroDark from './old-main-retro-dark.png'
import oldMainRetro from './old-main-retro.png'
import oldMainDark from './old-main-dark.png'
import oldMain from './old-main.png'
import windmillSkyDark from './windmill-sky-dark.png'
import windmillSky from './windmill-sky.png'
import windmillDawnDark from './windmill-dawn-dark.png'
import windmillDawn from './windmill-dawn.png'
import windmillGoldenHourDark from './windmill-golden-hour-dark.png'
import windmillGoldenHour from './windmill-golden-hour.png'
import windmillDark from './windmill-dark.png'
import windmill from './windmill.png'

/**
 * Previews of each Icon Composer document in assets/, in its light and dark
 * renditions, rendered by `mise run icons`. The keys are the documents'
 * names, which are also what iOS reports as the alternate icon's name.
 */
export const appIcons = {
	windmill: {
		light: windmill,
		dark: windmillDark,
	},
	'old-main': {
		light: oldMain,
		dark: oldMainDark,
	},
	'old-main-retro': {
		light: oldMainRetro,
		dark: oldMainRetroDark,
	},
	lion: {
		light: lion,
		dark: lionDark,
	},
	'o-is-for-olaf': {
		light: oIsForOlaf,
		dark: oIsForOlafDark,
	},
	'windmill-sky': {
		light: windmillSky,
		dark: windmillSkyDark,
	},
	'windmill-dawn': {
		light: windmillDawn,
		dark: windmillDawnDark,
	},
	'windmill-golden-hour': {
		light: windmillGoldenHour,
		dark: windmillGoldenHourDark,
	},
} satisfies Record<string, {light: ImageSourcePropType; dark: ImageSourcePropType}>

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

/**
 * The preview matching the app's appearance, from `useColorScheme()`. The
 * Credits screen and the App Icon gallery show it, and the Customize sheet's
 * App Icon row scales it down.
 */
export function previewFor(
	name: AppIconName,
	scheme: string | null | undefined,
): ImageSourcePropType {
	return scheme === 'dark' ? appIcons[name].dark : appIcons[name].light
}
