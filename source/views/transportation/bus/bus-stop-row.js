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
  skippingStopDetail: {},
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

export class BusStopRow extends React.PureComponent {
  props: {
    time: moment,
    now: moment,
    barColor: string,
    currentStopColor: string,
    place: string,
    times: FancyBusTimeListType,
    isFirstRow: boolean,
    isLastRow: boolean,
  }

  render() {
    const {
      time,
      now,
      barColor,
      currentStopColor,
      place,
      times,
      isFirstRow,
      isLastRow,
    } = this.props

    const afterStop = time && now.isAfter(time, 'minute')
    const atStop = time && now.isSame(time, 'minute')
    const beforeStop = !afterStop && !atStop && time !== false
    const skippingStop = time === false

    return (
      <ListRow fullWidth={true} fullHeight={true}>
        <Row>
          <ProgressChunk
            barColor={barColor}
            afterStop={afterStop}
            beforeStop={beforeStop}
            atStop={atStop}
            skippingStop={skippingStop}
            currentStopColor={currentStopColor}
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
              <ScheduleTimes times={times} skippingStop={skippingStop} />
            </Detail>
          </Column>
        </Row>
      </ListRow>
    )
  }
}

class ScheduleTimes extends React.PureComponent {
  props: {
    skippingStop: boolean,
    times: FancyBusTimeListType,
  }

  render() {
    const {times, skippingStop} = this.props

    return (
      <Text style={skippingStop && styles.skippingStopDetail}>
        {times
          // and format the times
          .map(time => (time === false ? 'None' : time.format(TIME_FORMAT)))
          .join(' • ')}
      </Text>
    )
  }
}
