// @flow
import React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import {ListRow} from '../../components/list'
import type {FancyBusTimeListType} from './types'
import type moment from 'moment'
import * as c from '../../components/colors'
import {ProgressChunk} from './components/progress-chunk'

const TIME_FORMAT = 'h:mma'

const styles = StyleSheet.create({
  skippingStopTitle: {
    color: c.iosDisabledText,
  },
  skippingStopDetail: {
  },
  row: {
    flexDirection: 'row',
  },
  rowDetail: {
    paddingVertical: Platform.OS === 'ios' ? 8 : 15,
  },
  itemDetail: {
    color: c.iosDisabledText,
    fontSize: 13,
  },
  atStopTitle: {
    fontWeight: 'bold',
  },
  passedStopTitle: {
    color: c.iosDisabledText,
  },
})

export function BusStopRow({time, now, barColor, currentStopColor, place, times}: {
  time: moment,
  now: moment,
  barColor: string,
  currentStopColor: string,
  place: string,
  times: FancyBusTimeListType,
}) {
  const afterStop = time && now.isAfter(time, 'minute')
  const atStop = time && now.isSame(time, 'minute')
  const beforeStop = !afterStop && !atStop && time !== false
  const skippingStop = time === false

  return (
    <ListRow
      fullWidth={true}
      fullHeight={true}
      style={styles.rowDetail}
    >
      <Row>
        <ProgressChunk {...{barColor, afterStop, beforeStop, atStop, skippingStop, currentStopColor}} />

        <Column>
          <Title style={[
            skippingStop && styles.skippingStopTitle,
            afterStop && styles.passedStopTitle,
            atStop && styles.atStopTitle,
          ]}>{place}</Title>
          <Detail>
            <ScheduleTimes {...{times, skippingStop}} />
          </Detail>
        </Column>
      </Row>
    </ListRow>
  )
}

const ScheduleTimes = ({times, skippingStop}: {
  skippingStop: boolean,
  times: FancyBusTimeListType,
}) => {
  return (
    <Text
      style={[styles.itemDetail, skippingStop && styles.skippingStopDetail]}
      numberOfLines={1}
    >
      {times
        // and format the times
        .map(time => time === false ? 'None' : time.format(TIME_FORMAT))
        .join(' • ')}
    </Text>
  )
}
