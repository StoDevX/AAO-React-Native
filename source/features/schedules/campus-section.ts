import type {EventType} from '@frogpond/event-type'

/** A named calendar listed as a schedule at `/schedule/<id>`. */
export type ScheduleEntry = {
	/** The route's last segment: `/schedule/sumo`. Unique across campuses. */
	id: string
	/** The screen's title. */
	title: string
	/** The named calendar on the campus's server. */
	calendar: string
	/** Rewrites each event before it's listed, e.g. trims "SUMO Movie: ". */
	eventMapper?: (event: EventType) => EventType
}

/** A campus's schedules: its radio stations' and any others, such as SUMO's films. */
export type SchedulesSection = {
	entries: ReadonlyArray<ScheduleEntry>
}
