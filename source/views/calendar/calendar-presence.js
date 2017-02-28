// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {EventList} from './event-list'
import {tracker} from '../../analytics'
import type {PresenceEventType, EventType} from './types'
import moment from 'moment-timezone'
import delay from 'delay'
import LoadingView from '../components/loading'
const TIMEZONE = 'America/Winnipeg'

export class PresenceCalendarView extends React.Component {
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
    url: string,
  };

  convertEvents(data: PresenceEventType[], now: moment): EventType[] {
    return data
      .map(event => {
        const startTime = moment(event.startDateTimeUtc)
        const endTime = moment(event.endDateTimeUtc)
        return {
          startTime,
          endTime,
          summary: event.eventName,
          location: `Where: ${event.location}\nOrg: ${event.organizationName}`,
          isOngoing: startTime.isBefore(now, 'day'),
          extra: {type: 'presence', data: event},
        }
      })
      .filter(event => {
        return event.endTime.isSameOrAfter(now)
      })
  }

  getEvents = async (now: moment=moment.tz(TIMEZONE)) => {
    let url = this.props.url

    let data: PresenceEventType[] = []
    try {
      data = await fetchJson(url)
    } catch (error) {
      tracker.trackException(error.message)
      this.setState({error: error.message})
      console.warn(error)
    }

    this.setState({
      now,
      loaded: true,
      events: this.convertEvents(data, now),
    })
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({refreshing: true})

    await this.getEvents()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
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
