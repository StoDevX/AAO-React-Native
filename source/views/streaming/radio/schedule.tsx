import * as React from 'react'
import {CccCalendarView} from '@frogpond/ccc-calendar'
export function KSTOScheduleView(): JSX.Element {
	return (
		<CccCalendarView
			calendar="ksto-schedule"
			eventMapper={(event) => ({
				...event,
				config: {
					...event.config,
					subtitle: 'description',
				},
			})}
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
		/>
	)
}

export function KRLXScheduleView(): JSX.Element {
	return (
		<CccCalendarView
			calendar="krlx-schedule"
			eventMapper={(event) => ({
				...event,
				config: {
					...event.config,
					subtitle: 'description',
				},
			})}
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
		/>
	)
}
