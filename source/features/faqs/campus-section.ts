import type {CampusId} from '../../campuses'

/** A campus's FAQs and notices, from `data/faqs.yaml`'s one list. */
export type FaqsSection = {
	/**
	 * The server the list comes from; the campus's own when absent. St. Olaf's
	 * serves both campuses' notices today.
	 */
	server?: CampusId
	/** Whether the FAQ screen falls back on the list's free-form text, which predates the list. */
	showsLegacyText?: true
}
