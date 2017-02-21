// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {StyleSheet, RefreshControl} from 'react-native'
import SimpleListView from '../components/listview'
import {tracker} from '../../analytics'
import type {EventType} from './types'
import groupBy from 'lodash/groupBy'
import size from 'lodash/size'
import moment from 'moment-timezone'
import delay from 'delay'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {NoticeView} from '../components/notice'
import LoadingView from '../components/loading'
import qs from 'querystring'
import EventView from './event'
import { GOOGLE_CALENDAR_API_KEY } from '../../lib/config'
const TIMEZONE = 'America/Winnipeg'

type GoogleCalendarTimeType = {
  dateTime: string,
};
type GoogleCalendarEventType = {
  summary: string,
  start: GoogleCalendarTimeType,
  end: GoogleCalendarTimeType,
  location: string,
};

export default class CalendarView extends React.Component {
  state = {
    events: {},
    loaded: false,
    refreshing: true,
    error: null,
  }

  componentWillMount() {
    this.refresh()
  }

  props: {
    calendarId: string,
  };

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

  groupEvents(data: GoogleCalendarEventType[], now: moment) {
    const events: EventType[] = data.map(event => {
      const startTime = moment(event.start.date || event.start.dateTime)
      const endTime = moment(event.end.date || event.end.dateTime)
      return {
        ...event,
        startTime,
        endTime,
        isOngoing: startTime.isBefore(now, 'day'),
      }
    })

    return groupBy(events, event => {
      if (event.isOngoing) {
        return 'Ongoing'
      }
      if (event.startTime.isSame(now, 'day')) {
        return 'Today'
      }
      return event.startTime.format('ddd  MMM Do')  // google returns events in CST
    })
  }

  getEvents = async (now: moment=moment.tz(TIMEZONE)) => {
    let url = this.buildCalendarUrl(this.props.calendarId)

    let data: GoogleCalendarEventType[] = []
    try {
      let result = await fetchJson(url)
      const error = result.error
      if (error) {
        tracker.trackException(error.message)
        this.setState({error: error})
      }

      data = result.items
    } catch (error) {
      tracker.trackException(error.message)
      this.setState({error: error.message})
      console.warn(error)
    }

    const grouped = this.groupEvents(data, now)

    this.setState({
      loaded: true,
      events: grouped,
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

  renderSectionHeader = (sectionData: EventType[], sectionIdentifier: string) => {
    return <ListSectionHeader title={sectionIdentifier} spacing={{left: 10}} />
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    return <ListSeparator fullWidth={true} key={`${sectionID}-${rowID}`} />
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (this.state.error) {
      return <NoticeView text={this.state.error} />
    }

    if (!size(this.state.events)) {
      return <NoticeView text='No events.' />
    }

    return (
      <SimpleListView
        style={styles.container}
        forceBottomInset={true}
        data={this.state.events}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      >
        {(data: EventType) => <EventView {...data} />}
      </SimpleListView>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
})
