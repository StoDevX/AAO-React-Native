import type {CampusId} from '../../campuses'

/** A campus's curated important contacts, which `GET contacts` serves. */
export type ContactsSection = {
	/** The Contacts screen's title, as the campus's Home tile names it. */
	title: string
	/** The server the contacts come from; the campus's own when absent. */
	server?: CampusId
	/**
	 * The college's own directory, on the web, for a campus whose people the
	 * app cannot search itself. The Contacts screen offers it in the search
	 * bar's place.
	 */
	directoryUrl?: string
}

export type DirectorySection = {
	/** The college's own directory search, which the screen asks directly. Ends in a slash. */
	searchUrl: string
	/** The campus whose server lists the departments; the campus's own when absent. */
	server?: CampusId
}
