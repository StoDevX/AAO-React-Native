// @flow

import React from 'react'
import {GoogleCalendarView} from '../../calendar/calendar-google'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType & {}

export default class KSTOSchedule extends React.PureComponent<Props> {
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
