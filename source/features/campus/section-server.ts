import type {CampusId} from '../../campuses/ids'

/** The campus whose server a section fetches from: the one it names, else `campus` itself. */
export function sectionServer(
	campus: CampusId,
	section: {server?: CampusId} | undefined,
): CampusId {
	return section?.server ?? campus
}
