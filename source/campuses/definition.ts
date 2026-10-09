import type {HoursSection} from '../features/building-hours/campus-section'
import type {MapSection} from '../features/map/campus-section'
import type {BrandingSection} from '../features/campus/campus-section'
import type {ContactsSection} from '../features/directory/campus-section'
import type {ApiSection} from '../features/developer/campus-section'
import type {HomeSection} from '../features/home/campus-section'
import type {SupportSection} from '../features/support/campus-section'
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
	/** The app's name, support address, About intro and Home's notices. */
	branding: BrandingSection
	/** Home's tiles, in order. */
	home: HomeSection
	// Optional: a campus without a section doesn't have that feature.
	support?: SupportSection
	contacts?: ContactsSection
	/** The campus's server, and its field in developer settings. */
	api: ApiSection
	/**
	 * The id the 2.9 release candidates' published data names this campus by
	 * (`carleton`). Only the parsers of that data read it; see
	 * `campusIdFromPublished`.
	 */
	publishedAs?: string
	map?: MapSection
	hours?: HoursSection
}
