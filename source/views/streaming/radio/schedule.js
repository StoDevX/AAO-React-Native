// @flow

import React from 'react'
import {GoogleCalendarView} from '../../calendar/calendar-google'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType & {}

export class KSTOScheduleView extends React.PureComponent<Props> {
  static navigationOptions = {
    title: 'Show Schedule',
  }

  render() {
    return (
      <GoogleCalendarView
        calendarId="kstonarwhal@gmail.com"
        navigation={this.props.navigation}
      />
    )
  }
}
