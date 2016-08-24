// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  ListView,
} from 'react-native'

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
type StateType = {
  events: null|GoogleCalendarResponseType,
  loaded: boolean,
  error: null|string,
};
type GoogleCalendarResponseType = {
  items: GoogleCalendarEventType[],
};

export default class CalendarView extends React.Component {
  static propTypes = {
    source: React.PropTypes.oneOf(['master', 'oleville']).isRequired,
  }

  state: StateType = {
    events: null,
    loaded: false,
    error: null,
  }

  componentWillMount() {
    if (this.props.source === 'master') {
      this.getMasterEvents()
    } else {
      this.getOlevilleEvents()
    }
  }

  _rowHasChanged(r1: GoogleCalendarEventType, r2: GoogleCalendarEventType) {
    return r1.summary != r2.summary
  }

  async getMasterEvents() {
    this.getEvents('le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com')
  }

  async getOlevilleEvents() {
    this.getEvents('stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com')
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

  async getEvents(calendarId: string) {
    let url = this.buildCalendarUrl(calendarId)
    console.log(url)

    let data = null
    let error = null
    try {
      let result = await fetch(url).then(r => r.json())
      error = result.error
      data = result.items
    } catch (error) {
      this.setState({error: 'Error!'})
      console.error(error)
    }

    if (data) {
      this.setState({events: data})
    }
    if (error) {
      this.setState({error: error.message})
    }
    this.setState({loaded: true})
  }

  render() {
    if (!this.state.events) {
      return <LoadingView />
    }

    if (this.state.error) {
      return (
        <Text>
          {this.state.error}
        </Text>
      )
    }

    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })

    return (
      <ListView
        style={styles.container}
        dataSource={ds.cloneWithRows(this.state.events)}
        renderRow={data =>
          <EventView
            style={styles.row}
            eventTitle={data.summary}
            startTime={data.start.dateTime}
            endTime={data.end.dateTime}
            location={data.location}
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
    marginRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
})
