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

import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import delay from 'delay'
import LoadingView from '../components/loading'
import qs from 'querystring'
import EventView from './event'
import * as c from '../components/colors'
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
      rowHasChanged: this.rowHasChanged,
      sectionHeaderHasChanged: this.sectionHeaderHasChanged,
    }),
    loaded: false,
    refreshing: true,
    error: null,
    noEvents: false,
  }

  componentWillMount() {
    this.refresh()
  }

  rowHasChanged(r1: GoogleCalendarEventType, r2: GoogleCalendarEventType) {
    return r1.summary !== r2.summary
  }

  sectionHeaderHasChanged(h1: number, h2: number) {
    return h1 !== h2
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

    if (data && data.length) {
      data.forEach(event => {
        event.startTime = moment(event.start.date || event.start.dateTime)
        event.endTime = moment(event.end.date || event.end.dateTime)
      })
      let grouped = groupBy(data, event => event.startTime.format('ddd  MMM Do'))
      this.setState({events: this.state.events.cloneWithRowsAndSections(grouped)})
    } else if (data && !data.length) {
      this.setState({noEvents: true})
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

  renderRow = (data: Object) => {
    return (
      <EventView
        style={styles.row}
        eventTitle={data.summary}
        startTime={data.startTime}
        endTime={data.endTime}
        location={data.location}
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
    return <View key={`${sectionID}-${rowID}`} style={styles.separator} />
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
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ebebeb',
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
