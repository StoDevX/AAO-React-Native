// @flow
import React from 'react'
import {Platform, StyleSheet, Text} from 'react-native'
import {Row, Column} from '../../components/layout'
import {ListRow, Detail, Title} from '../../components/list'
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
  internalPadding: {
    paddingVertical: Platform.OS === 'ios' ? 8 : 15,
  },
  atStopTitle: {
    fontWeight: Platform.OS === 'ios' ? '500' : '600',
  },
  passedStopTitle: {
    color: c.iosDisabledText,
  },
})

export function BusStopRow({
  time,
  now,
  barColor,
  currentStopColor,
  place,
  times,
  isFirstRow,
  isLastRow,
}: {
  time: moment,
  now: moment,
  barColor: string,
  currentStopColor: string,
  place: string,
  times: FancyBusTimeListType,
  isFirstRow: boolean,
  isLastRow: boolean,
}) {
  const afterStop = time && now.isAfter(time, 'minute')
  const atStop = time && now.isSame(time, 'minute')
  const beforeStop = !afterStop && !atStop && time !== false
  const skippingStop = time === false

  return (
    <ListRow
      fullWidth={true}
      fullHeight={true}
    >
      <Row>
        <ProgressChunk
          {...{barColor, afterStop, beforeStop, atStop, skippingStop, currentStopColor}}
          isFirstChunk={isFirstRow}
          isLastChunk={isLastRow}
        />

        <Column flex={1} style={styles.internalPadding}>
          <Title
            bold={false}
            style={[
              skippingStop && styles.skippingStopTitle,
              afterStop && styles.passedStopTitle,
              atStop && styles.atStopTitle,
            ]}
          >
            {place}
          </Title>
          <Detail lines={1}>
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
    <Text style={skippingStop && styles.skippingStopDetail}>
      {times
        // and format the times
        .map(time => time === false ? 'None' : time.format(TIME_FORMAT))
        .join(' • ')}
    </Text>
  )
}
