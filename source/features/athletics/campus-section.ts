import type {CampusId} from '../../campuses/ids'

/** Athletics scores and schedules, as St. Olaf's server relays them. */
export type AthleticsSection = {
	/** The campus whose server relays them; the campus's own when absent. */
	server?: CampusId
}
