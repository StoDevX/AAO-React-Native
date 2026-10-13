import type {CalendarSection} from '../features/calendar/campus-section'
import type {HoursSection} from '../features/building-hours/campus-section'
import type {MapSection} from '../features/map/campus-section'
import type {BrandingSection} from '../features/campus/campus-section'
import type {ContactsSection, DirectorySection} from '../features/directory/campus-section'
import type {DictionarySection} from '../features/dictionary/campus-section'
import type {NewsSection} from '../features/news/campus-section'
import type {RadioSection} from '../features/streaming/radio/campus-section'
import type {SchedulesSection} from '../features/schedules/campus-section'
import type {PaperSection} from '../features/newspaper/campus-section'
import type {ConvosSection} from '../features/carleton/campus-section'
import type {QuickActionsSection} from '../features/quick-actions/campus-section'
import type {AppIconsSection} from '../features/customize/campus-section'
import type {AboutSection} from '../features/about/campus-section'
import type {FaqsSection} from '../features/faqs/campus-section'
import type {StudentOrgsSection} from '../features/student-orgs/campus-section'
import type {StreamingSection} from '../features/streaming/campus-section'
import type {AthleticsSection} from '../features/athletics/campus-section'
import type {PrintingSection} from '../lib/stoprint/campus-section'
import type {BalancesSection} from '../features/sis/campus-section'
import type {MoreSection} from '../features/more/campus-section'
import type {CourseCatalogSection} from '../features/sis/course-search/campus-section'
import type {StudentWorkSection} from '../features/sis/student-work/campus-section'
import type {MenusSection} from '../features/menus/campus-section'
import type {TransitSection} from '../features/transit/campus-section'
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
	/** Listed by the first-run picker only in dev mode: a campus for testing, not for students. */
	devOnly?: true
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
	/** The cafés Menus' tab bar lists. */
	menus?: MenusSection
	transit?: TransitSection
	dictionary?: DictionarySection
	/** The people directory; St. Olaf's alone. */
	directory?: DirectorySection
	calendar?: CalendarSection
	news?: NewsSection
	radio?: RadioSection
	/** Schedules listed at /schedule/<id>. */
	schedules?: SchedulesSection
	paper?: PaperSection
	convos?: ConvosSection
	quickActions?: QuickActionsSection
	appIcons?: AppIconsSection
	about?: AboutSection
	faqs?: FaqsSection
	/** Student organizations; St. Olaf's alone. */
	studentOrgs?: StudentOrgsSection
	/** Webcams and streamed events; St. Olaf's alone. */
	streaming?: StreamingSection
	/** Athletics scores and schedules; St. Olaf's alone. */
	athletics?: AthleticsSection
	/** stoPrint print jobs; St. Olaf's alone. */
	printing?: PrintingSection
	/** Dining and OneCard balances; St. Olaf's alone. */
	balances?: BalancesSection
	/** The A–Z of campus links; St. Olaf's alone. */
	more?: MoreSection
	/** The course catalog; St. Olaf's alone. */
	courseCatalog?: CourseCatalogSection
	/** Student job postings; St. Olaf's alone. */
	studentWork?: StudentWorkSection
}
