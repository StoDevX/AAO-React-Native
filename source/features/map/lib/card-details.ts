import {schedulesWithContent} from '../../building-hours/lib'
import type {BuildingType} from '../../building-hours/types'
import {floorRows} from '../directory/directory'
import type {BuildingDirectory} from '../directory/types'
import type {Building, LabelLink} from '../types'
import {goodToKnowRows} from './good-to-know'
import {normalizeLinks} from './normalize-link'
import type {PlaceSections} from './place-sections'

/// Everything a building's card draws under its actions row.
export type CardDetails = {
	place: Building
	hours: BuildingType | undefined
	sections: PlaceSections
	directory: BuildingDirectory | undefined
	extraLinks: Array<LabelLink> | undefined
}

/**
 * Whether every section of a building's card would draw nothing, so the card
 * says so rather than leaving a blank sheet under its actions. Each test
 * mirrors the one its section makes before it draws.
 */
export function cardHasNoDetails({
	place,
	hours,
	sections,
	directory,
	extraLinks,
}: CardDetails): boolean {
	return (
		!place.photos?.[0] &&
		(!hours || schedulesWithContent(hours.schedule ?? []).length === 0) &&
		Object.values(sections).every((tiles) => tiles.length === 0) &&
		!place.description?.trim() &&
		goodToKnowRows(place).length === 0 &&
		normalizeLinks(place.rules).length === 0 &&
		(!directory || floorRows(directory).length === 0) &&
		normalizeLinks(place.floors).length === 0 &&
		[...(place.links ?? []), ...(extraLinks ?? [])].length === 0 &&
		!place.address
	)
}
