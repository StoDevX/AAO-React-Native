import type {ColorValue} from 'react-native'
import type {EventType} from '@frogpond/event-type'
import type {Moment} from 'moment-timezone'

export interface PoweredBy {
	title: string
	href: string
}

/**
 * An event, tagged with the calendar it came from. Declared here, in the
 * lower, reusable layer, rather than in `@frogpond/ccc-calendar` -- that
 * package already depends on event-list and re-exports this rather than
 * keeping its own copy, so there is exactly one definition to drift.
 */
export interface SourcedEvent {
	sourceId: string
	key: string
	event: EventType
}

/**
 * Anything that can contribute events to the list, and how to tint its rows.
 * Same reasoning as `SourcedEvent` above -- owned here, re-exported by
 * `@frogpond/ccc-calendar`.
 */
export interface CalendarSource {
	id: string
	title: string
	color: ColorValue
	kind: 'remote' | 'device'
}

export interface EventGroup {
	title: string
	data: [EventType, ...EventType[]]
}

export interface EventDetailTime {
	start: string
	end: string
	allDay: boolean
}

export interface EventListProps {
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: (() => void) | null | undefined
	now: Moment
	poweredBy?: PoweredBy
}
