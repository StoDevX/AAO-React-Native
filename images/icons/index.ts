import type {ImageSourcePropType} from 'react-native'
import sunsetBehindMainIcon from './sunset-behind-main-icon.png'
import sunsetBehindMainLogo from './sunset-behind-main-logo.png'
import windmillDayIcon from './windmill-day-icon.png'
import windmillDayLogo from './windmill-day-logo.png'
import windmillIcon from './windmill-icon.png'
import windmillLogo from './windmill-logo.png'

type Previews = {
	/** The Settings picker's tile. */
	icon: ImageSourcePropType
	/** The Credits screen's logo. */
	logo: ImageSourcePropType
}

/**
 * Previews of each Icon Composer document in assets/, rendered by
 * `mise run icons`. The keys are the documents' names, which are also what
 * iOS reports as the alternate icon's name.
 */
export const appIcons = {
	windmill: {icon: windmillIcon, logo: windmillLogo},
	'sunset-behind-main': {icon: sunsetBehindMainIcon, logo: sunsetBehindMainLogo},
	'windmill-day': {icon: windmillDayIcon, logo: windmillDayLogo},
} satisfies Record<string, Previews>

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
