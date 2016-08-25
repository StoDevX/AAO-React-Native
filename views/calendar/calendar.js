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
} from 'react-native'

import delay from 'delay'
import LoadingView from '../components/loading'
import qs from 'querystring'
import EventView from './event'
import { GOOGLE_CALENDAR_API_KEY } from '../../lib/config'

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
      rowHasChanged: this._rowHasChanged,
    }),
    loaded: false,
    refreshing: true,
    error: null,
  }

  componentWillMount() {
    this.getEvents()
  }

  _rowHasChanged(r1: GoogleCalendarEventType, r2: GoogleCalendarEventType) {
    return r1.summary != r2.summary
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

  getEvents = async () => {
    let url = this.buildCalendarUrl(this.props.calendarId)

    let data = null
    let error = null
    try {
      let result = await fetch(url).then(r => r.json())
      error = result.error
      data = result.items
    } catch (error) {
      this.setState({error: error.message})
      console.error(error)
    }

    if (data) {
      this.setState({events: this.state.events.cloneWithRows(data)})
    }
    if (error) {
      this.setState({error: error.message})
    }
    this.setState({loaded: true})
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

    if (this.state.error) {
      return <Text>{this.state.error}</Text>
    }

    return (
      <ListView
        style={styles.container}
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.events}
        pageSize={5}
        renderRow={data =>
          <EventView
            style={styles.row}
            eventTitle={data.summary}
            startTime={data.start.dateTime}
            endTime={data.end.dateTime}
            location={data.location}
          />
        }
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
    minHeight: 88,
    marginLeft: 10,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
})
