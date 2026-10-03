import {type AppIconName, iconFor} from '../../../images/icons'

/** The gallery's sections. */
export type IconGroup = 'Classic' | 'Windmill'

/** An icon as the gallery names and files it. */
export type IconEntry = {
	title: string
	type: AppIconName
	group: IconGroup
}

/** Every shipped icon, in the order the gallery shows them. */
export const ICONS: ReadonlyArray<IconEntry> = [
	{title: 'Big Ole', type: 'windmill', group: 'Classic'},
	{title: 'Old Main', type: 'sunset-behind-main', group: 'Classic'},
	{title: 'Old Main (Hill)', type: 'old-main-hill', group: 'Classic'},
	{title: 'Old Main (CRT)', type: 'old-main-crt', group: 'Classic'},
	{title: 'Constellation', type: 'constellation', group: 'Classic'},
	{title: 'Windmill (Day)', type: 'windmill-day', group: 'Windmill'},
	{title: 'Windmill (Dawn)', type: 'windmill-dawn', group: 'Windmill'},
	{title: 'Windmill (Golden Hour)', type: 'windmill-golden-hour', group: 'Windmill'},
	{title: 'Windmill (Night)', type: 'windmill-night', group: 'Windmill'},
	{title: 'Windmill (Stars)', type: 'windmill-stars', group: 'Windmill'},
	{title: 'Windmill (Aurora)', type: 'windmill-aurora', group: 'Windmill'},
	{title: 'Windmill (Storm)', type: 'windmill-storm', group: 'Windmill'},
	{title: 'Windmill (Fog)', type: 'windmill-fog', group: 'Windmill'},
	{title: 'Windmill (Snow)', type: 'windmill-snow', group: 'Windmill'},
]

const GROUP_ORDER: ReadonlyArray<IconGroup> = ['Classic', 'Windmill']

/** The icons sectioned for the grid, in gallery order. */
export function iconsByGroup(): Array<{group: IconGroup; icons: Array<IconEntry>}> {
	return GROUP_ORDER.map((group) => ({
		group,
		icons: ICONS.filter((icon) => icon.group === group),
	}))
}

/** The gallery's entry for `type`. Every `AppIconName` has one; the test holds it to that. */
export function iconEntry(type: AppIconName): IconEntry {
	return ICONS.find((icon) => icon.type === type) ?? ICONS[0]
}

/**
 * Where the icon iOS reports as current sits in the gallery, for the row's
 * label and the carousel's starting page. A name this build does not ship
 * reads as the primary, as `iconFor` does.
 */
export function iconPosition(systemName: string): {
	entry: IconEntry
	index: number
	total: number
} {
	let entry = iconEntry(iconFor(systemName))
	return {entry, index: ICONS.indexOf(entry), total: ICONS.length}
}
