import {type AppIconName, DEFAULT_ICON, iconFor} from '../../../images/icons'
import type {Campus} from '../campus/store'

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

/** Each campus's gallery sections, in order. A campus offers only its own icons. */
const GROUP_ORDER: Record<Campus, ReadonlyArray<IconGroup>> = {
	stolaf: ['Classic', 'Windmill'],
	carleton: ['CARLS'],
}

/** The icons `campus` offers, sectioned for the grid, in gallery order. */
export function iconsByGroup(
	campus: Campus = 'stolaf',
): Array<{group: IconGroup; icons: Array<IconEntry>}> {
	return GROUP_ORDER[campus].map((group) => ({
		group,
		icons: ICONS.filter((icon) => icon.group === group),
	}))
}

/** The icon each campus starts from: the primary for St. Olaf, the penguin for Carleton. */
const CAMPUS_ICON: Record<Campus, AppIconName> = {
	stolaf: DEFAULT_ICON,
	carleton: 'carls-penguin',
}

/**
 * The icon to switch to on choosing `campus`, or null to keep `current`. An
 * icon of the campus's own stays; one from the other campus gives way to the
 * campus's starting icon, so a Carleton install never wears St. Olaf's.
 */
export function iconForCampus(current: AppIconName, campus: Campus): AppIconName | null {
	let offered = GROUP_ORDER[campus]
	return offered.includes(iconEntry(current).group) ? null : CAMPUS_ICON[campus]
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
