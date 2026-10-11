import {type AppIconName, DEFAULT_ICON, iconFor} from '../../../images/icons'
import type {AppIconsSection} from './campus-section'

/** The gallery's sections. */
export type IconGroup = 'Classic' | 'Windmill' | 'CARLS'

/** An icon as the gallery names and files it. */
export type IconEntry = {
	title: string
	type: AppIconName
	group: IconGroup
}

/** Every shipped icon, in the order the gallery shows them. */
export const ICONS: ReadonlyArray<IconEntry> = [
	{title: 'Big Ole', type: 'windmill', group: 'Classic'},
	{title: 'Old Main', type: 'old-main', group: 'Classic'},
	{title: 'Old Main (Retro)', type: 'old-main-retro', group: 'Classic'},
	{title: 'Windmill (Sky)', type: 'windmill-sky', group: 'Windmill'},
	{title: 'Windmill (Dawn)', type: 'windmill-dawn', group: 'Windmill'},
	{title: 'Windmill (Golden Hour)', type: 'windmill-golden-hour', group: 'Windmill'},
	{title: 'Penguin', type: 'carls-penguin', group: 'CARLS'},
]

/** The icons a campus with `appIcons` offers, sectioned for the grid, in gallery order. */
export function iconsByGroup(
	appIcons: AppIconsSection | undefined,
): Array<{group: IconGroup; icons: Array<IconEntry>}> {
	return (appIcons?.groups ?? []).map((group) => ({
		group,
		icons: ICONS.filter((icon) => icon.group === group),
	}))
}

/**
 * The icon to switch to on choosing a campus with `appIcons`, or null to keep
 * `current`. An icon of the campus's own stays; another campus's gives way to
 * the campus's starting icon, so a Carleton install never wears St. Olaf's. A
 * campus without app icons, or one already wearing that icon, leaves it alone.
 */
export function iconForCampus(
	current: AppIconName,
	appIcons: AppIconsSection | undefined,
): AppIconName | null {
	if (!appIcons || appIcons.groups.includes(iconEntry(current).group)) {
		return null
	}
	let next = appIcons.default ?? DEFAULT_ICON
	return next === current ? null : next
}

/** The gallery's entry for `type`. Every `AppIconName` has one; the test holds it to that. */
export function iconEntry(type: AppIconName): IconEntry {
	return ICONS.find((icon) => icon.type === type) ?? ICONS[0]
}

/**
 * The gallery's entry for the icon iOS reports as current. A name this build
 * does not ship reads as the primary, as `iconFor` does.
 */
export function currentIconEntry(systemName: string): IconEntry {
	return iconEntry(iconFor(systemName))
}

/**
 * How many icons the gallery fits across at a font scale: three normally, two
 * at the first accessibility sizes and one beyond, so a long caption such as
 * "Windmill (Golden Hour)" breaks between words rather than inside one.
 */
export function galleryColumns(fontScale: number): number {
	if (fontScale > 2) {
		return 1
	}
	if (fontScale > 1.5) {
		return 2
	}
	return 3
}
