import type {AppIconName} from '../../../images/icons'
import type {IconGroup} from './icons'

/** The app icons a campus offers. A campus without one offers none, and leaves the icon alone. */
export type AppIconsSection = {
	/** The gallery's sections, in order. A campus offers only its own icons. */
	groups: ReadonlyArray<IconGroup>
	/**
	 * The icon to move to when the current one isn't the campus's own. Absent,
	 * the build's primary icon, which app.config.ts sets per app.
	 */
	default?: AppIconName
}
