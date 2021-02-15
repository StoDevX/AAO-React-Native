import * as React from 'react'
import {timezone} from '@frogpond/constants'
import type {NavigationScreenProp} from 'react-navigation'
import {fetch} from '@frogpond/fetch'
import {EventList} from '@frogpond/event-list'
import type {PoweredBy} from '@frogpond/event-list'
import type {EventType} from '@frogpond/event-type'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import {LoadingView} from '@frogpond/notice'
import {API} from '@frogpond/api'

type Props = {
	calendar:
		| string
		| {type: 'google'; id: string}
		| {type: 'reason'; url: string}
		| {type: 'ics'; url: string}
	detailView?: string
	eventMapper?: (event: EventType) => EventType
	navigation: NavigationScreenProp<undefined>
	poweredBy?: PoweredBy
}

type State = {
	events: EventType[]
	initialLoadComplete: boolean
	refreshing: boolean
	error?: Error
	now: Moment
}

export class CccCalendarView extends React.Component<Props, State> {
	state: State = {
		events: [],
		initialLoadComplete: false,
		refreshing: false,
		now: moment.tz(timezone()),
	}

	componentDidMount() {
		this.getEvents().then(() => {
			this.setState(() => ({initialLoadComplete: true}))
		})
	}

	convertEvents(data: EventType[]): EventType[] {
		let events = data.map((event) => {
			const startTime = moment(event.startTime)
			const endTime = moment(event.endTime)

			return {
				...event,
				startTime,
				endTime,
			}
		})

		if (this.props.eventMapper) {
			events = events.map(this.props.eventMapper)
		}

		return events
	}

	getEvents = async (reload?: boolean, now: Moment = moment.tz(timezone())) => {
		let url
		if (typeof this.props.calendar === 'string') {
			url = API(`/calendar/named/${this.props.calendar}`)
		} else if (this.props.calendar.type === 'google') {
			url = API('/calendar/google', {id: this.props.calendar.id})
		} else if (this.props.calendar.type === 'reason') {
			url = API('/calendar/reason', {url: this.props.calendar.url})
		} else if (this.props.calendar.type === 'ics') {
			url = API('/calendar/ics', {url: this.props.calendar.url})
		} else {
			this.state.error = new Error('invalid calendar type!')
		}

		const events: Array<EventType> = await fetch(url, {
			delay: reload ? 500 : 0,
		}).json()

		this.setState({now, events: this.convertEvents(events)})
	}

	refresh = async () => {
		this.setState(() => ({refreshing: true}))
		await this.getEvents(true)
		this.setState(() => ({refreshing: false}))
	}

	render() {
		if (!this.state.initialLoadComplete) {
			return <LoadingView />
		}

		return (
			<EventList
				detailView={this.props.detailView}
				events={this.state.events}
				message={this.state.error?.message}
				navigation={this.props.navigation}
				now={this.state.now}
				onRefresh={this.refresh}
				poweredBy={this.props.poweredBy}
				refreshing={this.state.refreshing}
			/>
		)
	}
}
