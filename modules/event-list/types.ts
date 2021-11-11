import type {NavigationScreenProp} from 'react-navigation'
import type {EventType} from '@frogpond/event-type'

type PoweredBy = {
	title: string
	href: string
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

export type NullableElement = JSX.Element | null
