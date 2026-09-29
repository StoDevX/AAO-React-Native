import type {ImageSourcePropType} from 'react-native'
import sunsetBehindMainIconDark from './sunset-behind-main-icon-dark.png'
import sunsetBehindMainIcon from './sunset-behind-main-icon.png'
import sunsetBehindMainLogoDark from './sunset-behind-main-logo-dark.png'
import sunsetBehindMainLogo from './sunset-behind-main-logo.png'
import windmillDayIconDark from './windmill-day-icon-dark.png'
import windmillDayIcon from './windmill-day-icon.png'
import windmillDayLogoDark from './windmill-day-logo-dark.png'
import windmillDayLogo from './windmill-day-logo.png'
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
