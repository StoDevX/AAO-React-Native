// @flow

import React from 'react'
import {GoogleCalendarView} from '../../calendar/calendar-google'

export default class KSTOSchedule extends React.PureComponent {
  static navigationOptions = {
    title: 'Show Schedule',
  }

  render() {
    return (
      <GoogleCalendarView
        navigation={this.props.navigation}
        calendarId="kstonarwhal@gmail.com"
      />
    )
  }
}
