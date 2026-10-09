import type {CampusId} from '../../campuses/ids'

/** Student organizations, as St. Olaf's server lists them from Presence. */
export type StudentOrgsSection = {
	/** The campus whose server lists the orgs; the campus's own when absent. */
	server?: CampusId
}
