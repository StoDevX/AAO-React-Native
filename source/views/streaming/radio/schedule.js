// @flow

import React from 'react'
import {CccCalendarView} from '../../calendar/calendar-ccc'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType

export class KSTOScheduleView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Show Schedule',
	}

	render() {
		return (
			<CccCalendarView
				calendar="ksto-schedule"
				eventMapper={event => ({
					...event,
					config: {
						...event.config,
						subtitle: 'description',
					},
				})}
				navigation={this.props.navigation}
				poweredBy={{
					title: 'Powered by the KSTO team',
					href: 'https://pages.stolaf.edu/ksto/',
				}}
			/>
		)
	}
}

export class KRLXScheduleView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Show Schedule',
	}

	render() {
		return (
			<CccCalendarView
				calendar="krlx-schedule"
				eventMapper={event => ({
					...event,
					config: {
						...event.config,
						subtitle: 'description',
					},
				})}
				navigation={this.props.navigation}
				poweredBy={{
					title: 'Powered by the KRLX team',
					href: 'http://www.krlx.org/schedule/',
				}}
			/>
		)
	}
}
