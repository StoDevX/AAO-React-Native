import type {CampusId} from '../../campuses/ids'
import type {BuildingType} from './types'

/** A campus's building hours: the Hours screens, and the venues the map's cards show. */
export type HoursSection = {
	/** The server whose `spaces/hours` this campus reads; its own when absent. */
	server?: CampusId
	/** The Hours screen's title. */
	title: string
	/**
	 * How a problem report names the campus, as in "Suggestion for Bookstore
	 * (Carleton)". Five venue names exist on both campuses, so a report
	 * naming only the building would be ambiguous.
	 */
	reportLabel: string
	/** Whether Hours carries a Map button, for a campus whose map has no home tile of its own. */
	showsMapButton: boolean
	/**
	 * Whether a venue's `image` names a picture in the published `spaces`
	 * images. Some venue keys collide across campuses, so a campus without this
	 * never looks its keys up.
	 */
	photos?: true
	/**
	 * This repository's copy of the venues, read in place of the server's by
	 * UI tests naming no campus and by the dev override: a field added here
	 * reaches the server only once it merges.
	 */
	bundled?: ReadonlyArray<BuildingType>
}
