import type {CampusId} from '../../campuses/ids'

/** stoPrint print jobs, through St. Olaf's server. */
export type PrintingSection = {
	/** The campus whose server reaches stoPrint; the campus's own when absent. */
	server?: CampusId
}
