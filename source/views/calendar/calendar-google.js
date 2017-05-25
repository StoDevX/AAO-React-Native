// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {EventList} from './event-list'
import bugsnag from '../../bugsnag'
import {tracker} from '../../analytics'
import moment from 'moment-timezone'
import delay from 'delay'
import LoadingView from '../components/loading'
import {fetchGoogleCalendarEvents, type EventType} from '../../lib/calendar'
const TIMEZONE = 'America/Winnipeg'

export class GoogleCalendarView extends React.Component {
  state: {
    events: EventType[],
    loaded: boolean,
    refreshing: boolean,
    error: ?Error,
    now: moment,
  } = {
    events: [],
    loaded: false,
    refreshing: true,
    error: null,
    now: moment.tz(TIMEZONE),
  }

  componentWillMount() {
    this.refresh()
  }

  props: {
    calendarId: string,
  }

  getEvents = async (now: moment = moment.tz(TIMEZONE)) => {
    let data: EventType[] = []
    try {
      data = await fetchGoogleCalendarEvents(this.props.calendarId)
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      console.warn(err)
      this.setState({error: err.message})
    }

    this.setState({
      now,
      loaded: true,
      events: data,
    })
  }

  refresh = async () => {
    const start = Date.now()
    this.setState({refreshing: true})

    await this.getEvents()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState({refreshing: false})
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    return (
      <EventList
        events={this.state.events}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
        now={this.state.now}
        message={this.state.error ? this.state.error.message : null}
      />
    )
  }
}
