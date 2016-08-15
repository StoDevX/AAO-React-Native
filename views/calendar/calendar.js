/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
} from 'react-native'

import EventView from './event'
import { GOOGLE_CALENDAR_API_KEY } from '../../lib/config'

export default class CalendarView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      masterEvents: null,
      masterLoaded: false,
      error: false,
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.summary != r2.summary
  }

  render() {
    return this.renderScene()
  }

  componentWillMount() {
    let nowDate = new Date()
    let nowString = nowDate.toISOString() // As needed by the Google Calendar API
    let offset = (nowDate.getTimezoneOffset() / 60)
    let offsetString = '-' + offset + ':00Z'
    nowString.replace('Z', offsetString)
    if (this.props.events == 'master') {
      this.getMasterEvents(GOOGLE_CALENDAR_API_KEY, nowString)
    } else {
      this.getOlevilleEvents(GOOGLE_CALENDAR_API_KEY, nowString)
    }
  }

  async getMasterEvents(apiKey, currentTime) {
    try {
      let response = await fetch ('https://www.googleapis.com/calendar/v3/calendars/le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin=' + currentTime + '&key=' + apiKey)
      let responseJson = await response.json()
      this.setState({masterEvents: responseJson})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }
    this.setState({masterLoaded: true})
  }

  async getOlevilleEvents(apiKey, currentTime) {
    try {
      let response = await fetch ('https://www.googleapis.com/calendar/v3/calendars/stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin=' + currentTime + '&key=' + apiKey)
      let responseJson = await response.json()
      this.setState({masterEvents: responseJson})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }
    this.setState({masterLoaded: true})
  }

  _renderRow(data) {
    return (
      <View style={styles.row}>
        <EventView eventTitle={data.summary} startTime={data.start.dateTime} endTime={data.end.dateTime} location={data.location} />
      </View>
    )
  }

  // Render a given scene
  renderScene() {
    if (this.state.masterEvents != null) {
      let ds = new ListView.DataSource({
        rowHasChanged: this._rowHasChanged,
      })
      return (
        <View style={styles.container}>
          <ListView
            dataSource={ds.cloneWithRows(this.state.masterEvents.items)}
            renderRow={this._renderRow.bind(this)}
          />
        </View>
      )
    } else {
      return (
        <Text> Loading </Text>
      )
    }
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {

  },
  title: {

  },
})
