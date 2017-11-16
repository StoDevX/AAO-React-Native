// @flow

import * as React from 'react'
import {Text} from 'react-native'
import type {DepartureTimeList} from '../types'

const TIME_FORMAT = 'h:mma'

type Props = {|
  +times: DepartureTimeList,
  +style?: any,
|}

export class ScheduleTimes extends React.PureComponent<Props, void> {
  render() {
    const {times} = this.props

    return (
      <Text>
        {times
          // and format the times
          .map(time => (!time ? 'None' : time.format(TIME_FORMAT)))
          .join(' • ')}
      </Text>
    )
  }
}
