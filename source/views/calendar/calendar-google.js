// @flow

import * as React from 'react'
import {EventList} from './event-list'
import bugsnag from '../../bugsnag'
import {tracker} from '../../analytics'
import type {TopLevelViewPropsType} from '../types'
import type {EventType, GoogleEventType, PoweredBy} from './types'
import moment from 'moment-timezone'
import delay from 'delay'
import LoadingView from '../components/loading'
import qs from 'querystring'
import {GOOGLE_CALENDAR_API_KEY} from '../../lib/config'
const TIMEZONE = 'America/Winnipeg'

type Props = TopLevelViewPropsType & {calendarId: string, poweredBy: ?PoweredBy}

type State = {
  events: EventType[],
  loading: boolean,
  refreshing: boolean,
  error: ?Error,
  now: moment,
}

export class GoogleCalendarView extends React.Component<Props, State> {
  state = {
    events: [],
    loading: true,
    refreshing: false,
    error: null,
    now: moment.tz(TIMEZONE),
  }

  componentWillMount() {
    this.getEvents().then(() => {
      this.setState(() => ({loading: false}))
    })
  }

  buildCalendarUrl(calendarId: string) {
    let calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
    let params = {
      maxResults: 50,
      orderBy: 'startTime',
      showDeleted: false,
      singleEvents: true,
      timeMin: new Date().toISOString(),
      key: GOOGLE_CALENDAR_API_KEY,
    }
    return `${calendarUrl}?${qs.stringify(params)}`
  }

  convertEvents(data: GoogleEventType[], now: moment): EventType[] {
    return data.map(event => {
      const startTime = moment(event.start.date || event.start.dateTime)
      const endTime = moment(event.end.date || event.end.dateTime)
      return {
        startTime,
        endTime,
        summary: event.summary || '',
        location: event.location || '',
        isOngoing: startTime.isBefore(now, 'day'),
        extra: {type: 'google', data: event},
      }
    })
  }

  getEvents = async (now: moment = moment.tz(TIMEZONE)) => {
    let url = this.buildCalendarUrl(this.props.calendarId)

    let data: GoogleEventType[] = []
    try {
      let result = await fetchJson(url)
      const error = result.error
      if (error) {
        tracker.trackException(error.message)
        bugsnag.notify(error)
        this.setState({error: error})
      }

      data = result.items
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      this.setState({error: err.message})
      console.warn(err)
    }

    this.setState({now, events: this.convertEvents(data, now)})
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
