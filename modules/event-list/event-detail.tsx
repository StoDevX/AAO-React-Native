import {EventType} from '@frogpond/event-type'
import {PoweredBy} from './types'

export {
	EventDetail,
	NavigationOptions as EventDetailNavigationOptions,
} from './event-detail-view'

export const NavigationKey = 'EventDetail' as const
export type ParamList = {event: EventType; poweredBy: PoweredBy}
