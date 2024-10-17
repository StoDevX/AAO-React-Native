import type {EventType} from '../event-type'
import type {Moment} from 'moment-timezone'

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
	detailView?: string
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: (() => void) | null | undefined
	now: Moment
	poweredBy?: string
	poweredByUrl?: string
}

export interface NavigationHeaderProps {
	title: string
	headerRight: React.JSX.Element
}
