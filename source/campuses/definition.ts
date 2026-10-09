import type {CampusId} from './ids'

/**
 * Everything the app knows about one campus. Each feature owns the type of its
 * own section, in `source/features/<feature>/campus-section.ts`; a campus
 * without a section does not have that feature.
 */
export type CampusDefinition = {
	/** The campus's id, its domain reversed: `edu.carleton`. */
	id: CampusId
	/** The college's name, as the campus switcher lists it. */
	name: string
}
