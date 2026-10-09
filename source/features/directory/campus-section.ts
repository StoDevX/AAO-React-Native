import type {CampusId} from '../../campuses'

/** A campus's curated important contacts, which `GET contacts` serves. */
export type ContactsSection = {
	/** The Contacts screen's title, as the campus's Home tile names it. */
	title: string
	/** The server the contacts come from; the campus's own when absent. */
	server?: CampusId
}
