import type {ColorValue} from 'react-native'
import type {EventType} from '@frogpond/event-type'
import type {Moment} from 'moment-timezone'

export interface PoweredBy {
	title: string
	href: string
}

/// An event, tagged with the calendar it came from. Structurally identical to
/// `@frogpond/ccc-calendar`'s `SourcedEvent` -- that package's callers pass
/// its values straight through, but event-list is the lower, reusable layer
/// and must not take a dependency on a domain package above it.
export interface SourcedEvent {
	sourceId: string
	key: string
	event: EventType
}

/// Anything that can contribute events to the list, and how to tint its rows.
/// Structurally identical to `@frogpond/ccc-calendar`'s `CalendarSource`, for
/// the same reason as `SourcedEvent` above.
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
