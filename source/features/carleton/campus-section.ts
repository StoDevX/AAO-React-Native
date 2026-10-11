import type {CampusId} from '../../campuses/ids'

/**
 * A campus's convocation recordings, which `/edu.carleton/convocations/archived` lists.
 * The recordings come from `convos/archived` on the campus's own server
 * unless `server` names another.
 */
export type ConvosSection = {
	server?: CampusId
}
