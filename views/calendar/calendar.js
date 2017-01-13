// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  Platform,
  ListView,
  RefreshControl,
  View,
} from 'react-native'
import {tracker} from '../../analytics'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import delay from 'delay'
import {Separator} from '../components/separator'
import LoadingView from '../components/loading'
import qs from 'querystring'
import EventView from './event'
import * as c from '../components/colors'
import { GOOGLE_CALENDAR_API_KEY } from '../../lib/config'
const TIMEZONE = 'America/Winnipeg'

type GoogleCalendarTimeType = {
  dateTime: string,
}
type GoogleCalendarEventType = {
  summary: string,
  start: GoogleCalendarTimeType,
  end: GoogleCalendarTimeType,
  location: string,
};

export default class CalendarView extends React.Component {
  static propTypes = {
    calendarId: React.PropTypes.string.isRequired,
  }

  state = {
    events: new ListView.DataSource({
      rowHasChanged: (r1: GoogleCalendarEventType, r2: GoogleCalendarEventType) => r1.summary !== r2.summary,
      sectionHeaderHasChanged: (h1: number, h2: number) => h1 !== h2,
    }),
    loaded: false,
    refreshing: true,
    error: null,
    noEvents: false,
  }

  componentWillMount() {
    this.refresh()
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

  getEvents = async (now: momentT=moment.tz(TIMEZONE)) => {
    let url = this.buildCalendarUrl(this.props.calendarId)

    let data = []
    try {
      let result = await fetchJson(url)
      let error = result.error
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

    data.forEach(event => {
      event.startTime = moment(event.start.date || event.start.dateTime)
      event.endTime = moment(event.end.date || event.end.dateTime)
      event.isOngoing = event.startTime.isBefore(now, 'day')
    })

    const grouped = groupBy(data, event => {
      if (event.isOngoing) {
        return 'Ongoing'
      }
      const isToday = event.startTime.isSame(now, 'day')
      if (isToday) {
        return 'Today'
      }
      return event.startTime.format('ddd  MMM Do')  // google returns events in CST
    })

    this.setState({
      loaded: true,
      events: this.state.events.cloneWithRowsAndSections(grouped),
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

  renderRow = (data: Object) => {
    return (
      <EventView
        style={styles.row}
        eventTitle={data.summary}
        startTime={data.startTime}
        endTime={data.endTime}
        location={data.location}
        isOngoing={data.isOngoing}
      />
    )
  }

  renderSectionHeader = (sectionData: Object, sectionIdentifier: any) => {
    return (
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText} numberOfLines={1}>
          {sectionIdentifier}
        </Text>
      </View>
    )
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    return <Separator key={`${sectionID}-${rowID}`} />
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (this.state.error) {
      return <Text>{this.state.error}</Text>
    }

    if (this.state.noEvents) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}>
          <Text>
            No events.
          </Text>
        </View>
      )
    }

    return (
      <ListView
        style={styles.container}
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.events}
        pageSize={5}
        renderRow={this.renderRow}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      />
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  row: {
    // marginLeft: 10,
    paddingRight: 10,
  },
  rowSectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
})
