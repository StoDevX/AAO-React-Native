import type {EventType} from '@frogpond/event-type'

/** SUMO's film schedule, a calendar on Carleton's ccc-server. */
export const SUMO_SOURCE_ID = 'sumo-schedule'

/** Carleton's upcoming convocations, a calendar on Carleton's ccc-server. */
export const CONVOS_SOURCE_ID = 'upcoming-convos'

export const SUMO_POWERED_BY = {
	title: 'Powered by SUMO',
	href: 'https://www.carleton.edu/student/orgs/sumo/',
}

export const CONVOS_POWERED_BY = {
	title: 'Powered by the Carleton Calendar',
	href: 'https://www.carleton.edu/convocations/',
}

/**
 * Every SUMO event is titled "SUMO Movie: <film>", which says nothing on a
 * screen already titled SUMO, so the list shows the film alone.
 */
export function sumoEventMapper(event: EventType): EventType {
	return {...event, title: event.title.replace(/^SUMO(?: Movie)?:\s*/u, '')}
}
