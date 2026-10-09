import type {CampusId} from '../../campuses/ids'

export type TransitSection = {
	/** The Transit screen's title where the campus names it apart from the root stack's "Transit". */
	title?: string
	/** The campus whose server has the bus lines and other modes; the campus's own when absent. */
	server?: CampusId
}
