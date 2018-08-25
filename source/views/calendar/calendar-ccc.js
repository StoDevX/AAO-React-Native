// @flow

import * as React from 'react'
import {EventList} from './event-list'
import bugsnag from '../../bugsnag'
import {tracker} from '../../analytics'
import type {TopLevelViewPropsType} from '../types'
import type {EventType, PoweredBy} from './types'
import moment from 'moment-timezone'
import delay from 'delay'
import LoadingView from '../../components/loading'
import {API} from '../../globals'
const TIMEZONE = 'America/Winnipeg'

type Props = TopLevelViewPropsType & {
	calendar:
		| string
		| {type: 'google', id: string}
		| {type: 'reason', url: string}
		| {type: 'ics', url: string},
	detailView?: string,
	eventMapper?: EventType => EventType,
	poweredBy: ?PoweredBy,
}

type State = {
	events: EventType[],
	loading: boolean,
	refreshing: boolean,
	error: ?Error,
	now: moment,
}

export class CccCalendarView extends React.Component<Props, State> {
	state = {
		events: [],
		loading: true,
		refreshing: false,
		error: null,
		now: moment.tz(TIMEZONE),
	}

	componentDidMount() {
		this.getEvents().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	convertEvents(data: EventType[]): EventType[] {
		let events = data.map(event => {
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

	getEvents = async (now: moment = moment.tz(TIMEZONE)) => {
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
			throw new Error('invalid calendar type!')
		}

		let data: EventType[] = []
		try {
			data = await fetchJson(url)
		} catch (err) {
			tracker.trackException(err.message)
			bugsnag.notify(err)
			this.setState({error: err.message})
			console.warn(err)
		}

		this.setState({now, events: this.convertEvents(data)})
	}

	refresh = async () => {
		let start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.getEvents()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({refreshing: false}))
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		return (
			<EventList
				detailView={this.props.detailView}
				events={this.state.events}
				message={this.state.error ? this.state.error.message : null}
				navigation={this.props.navigation}
				now={this.state.now}
				onRefresh={this.refresh}
				poweredBy={this.props.poweredBy}
				refreshing={this.state.refreshing}
			/>
		)
	}
}
