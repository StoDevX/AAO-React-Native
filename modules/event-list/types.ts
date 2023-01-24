import type {EventType} from '@frogpond/event-type'
import type {Moment} from 'moment-timezone'

export interface PoweredBy {
	title: string
	href: string
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
	detailView?: string
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: (() => void) | null | undefined
	now: Moment
	poweredBy?: PoweredBy
}

export type NavigationHeaderProps = {
	title: string
	headerRight: JSX.Element
}
