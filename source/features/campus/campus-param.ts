import {isCampusId, type CampusId} from '../../campuses'
import {currentCampusId, useCampusStore} from './store'

/**
 * The campus a route's `?campus=` param names, or the active campus for
 * anything else: a missing param, an empty one, or an id this build doesn't
 * have, such as `carleton` from a 2.9 Home Screen quick action. It never
 * throws for any param, so an old link cannot crash the screen it opens.
 * The campus store is read only when the param names no campus.
 */
export function campusFromParam(param: string | undefined): CampusId {
	return isCampusId(param) ? param : currentCampusId()
}

/** `campusFromParam` for a screen, re-rendering when the active campus changes. */
export function useCampusParam(param: string | undefined): CampusId {
	let active = useCampusStore((state) => state.campus)
	if (isCampusId(param)) {
		return param
	}
	return active ?? currentCampusId()
}
