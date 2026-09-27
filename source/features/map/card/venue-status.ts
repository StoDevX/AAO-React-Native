import type {Moment} from 'moment-timezone'

import {STATUS_TEXT} from '../../building-hours/hours-section'
import {
	contextualStatus,
	getShortBuildingStatus,
	hasDisplayableHours,
} from '../../building-hours/lib'
import type {BuildingType} from '../../building-hours/types'
import type {TileStatus} from './place-tile'

/// A venue's live status in its colour, as a place tile or a floor's row
/// shows it: none without a venue, a time, or hours to read.
export function venueStatus(
	venue: BuildingType | undefined,
	now: Moment | undefined,
): TileStatus | undefined {
	if (!now || !venue || !hasDisplayableHours(venue.schedule ?? [])) {
		return undefined
	}
	return {
		text: contextualStatus(venue, now).long,
		color: STATUS_TEXT[getShortBuildingStatus(venue, now)],
	}
}
