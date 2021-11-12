import type {EventType} from '@frogpond/event-type'
import type {NavigationScreenProp} from 'react-navigation'
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
	navigation: Navigation
	now: Moment
	poweredBy?: PoweredBy
}

type Navigation = NavigationScreenProp<{
	params: {event: EventType; poweredBy?: PoweredBy}
}>

export type Props = {
	navigation: Navigation
}

export type NavigationHeaderProps = {
	title: string
	headerRight: JSX.Element
}
