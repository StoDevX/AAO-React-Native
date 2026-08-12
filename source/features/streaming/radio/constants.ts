import {EventType} from '@frogpond/event-type'

export function eventMapper(event: EventType): EventType {
	return {
		...event,
		config: {
			...event.config,
			subtitle: 'description',
		},
	}
}

export const KSTO_POWERED_BY = {
	title: 'Powered by the KSTO team',
	href: 'https://pages.stolaf.edu/ksto/',
}

export const KRLX_POWERED_BY = {
	title: 'Powered by the KRLX team',
	href: 'https://www.krlx.org/schedule/',
}
