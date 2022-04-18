import React from 'react'
import {CccCalendarView} from '@frogpond/ccc-calendar'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType

export function KSTOScheduleView(props: Props): JSX.Element {
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
			navigation={props.navigation}
			poweredBy={{
				title: 'Powered by the KSTO team',
				href: 'https://pages.stolaf.edu/ksto/',
			}}
		/>
	)
}

KSTOScheduleView.navigationOptions = {
	title: 'Show Schedule',
}

export function KRLXScheduleView(props: Props): JSX.Element {
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
			navigation={props.navigation}
			poweredBy={{
				title: 'Powered by the KRLX team',
				href: 'https://www.krlx.org/schedule/',
			}}
		/>
	)
}

KRLXScheduleView.navigationOptions = {
	title: 'Show Schedule',
}
