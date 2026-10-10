import {visibleViews, type ViewType} from '../views'

/** A titled run of Home tiles, drawn after the main tiles under its own heading. */
export type HomeGroup = {
	title: string
	tiles: ReadonlyArray<ViewType>
}

/**
 * `groups` as Home draws them: each one's hidden tiles dropped by the rules
 * the main tiles follow, and a group left with none dropped entirely, so no
 * heading stands over nothing.
 */
export function visibleGroups(
	groups: ReadonlyArray<HomeGroup> | undefined,
	options: {isDev: boolean},
): Array<{title: string; tiles: ViewType[]}> {
	return (groups ?? [])
		.map((group) => ({title: group.title, tiles: visibleViews(group.tiles, options)}))
		.filter((group) => group.tiles.length > 0)
}
