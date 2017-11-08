// @flow
import React from 'react'
import {Text, StyleSheet, Platform, FlatList} from 'react-native'
import type {BusTimetableEntry, UnprocessedBusLine, BusSchedule} from './types'
import {
  makeSubtitle,
  processBusLine,
  getScheduleForNow,
  getCurrentBusIteration,
} from './lib'
import moment from 'moment-timezone'
import {Separator} from '../../components/separator'
import {BusStopRow} from './bus-stop-row'
import {ListSectionHeader, ListFooter} from '../../components/list'

const styles = StyleSheet.create({
  separator: {
    marginLeft: 45,
    // erase the gap in the bar caused by the separators' block-ness
    marginTop: -1,
  },
})

const BusLineSeparator = () => <Separator style={styles.separator} />
const EMPTY_SCHEDULE_MESSAGE = <Text>This line is not running today.</Text>
const FOOTER_MSG =
  'Bus routes and times subject to change without notice\n\nData collected by the humans of All About Olaf'
const FOOTER_EL = <ListFooter title={FOOTER_MSG} />

type Props = {
  line: UnprocessedBusLine,
  now: moment,
  openMap: () => any,
  onRefresh: () => any,
  refreshing: boolean,
}

type State = {
  subtitle: string,
  schedule: ?BusSchedule,
  currentBusIteration: false | number,
}

export class BusLine extends React.Component<Props, State> {
  state = {
    subtitle: 'Loading',
    schedule: null,
    currentBusIteration: false,
  }

  componentWillReceiveProps(nextProps: Props) {
    this.updateFromProps(nextProps)
  }

  shouldComponentUpdate(nextProps: Props) {
    return (
      this.props.now.isSame(nextProps.now, 'minute') ||
      this.props.line !== nextProps.line
    )
  }

  updateFromProps = (props: Props) => {
    // Finds the stuff that's shared between FlatList and renderItem

    const {line, now} = props

    const processedLine = processBusLine(line, now)
    const scheduleForToday = getScheduleForNow(processedLine.schedules, now)

    const busIndex = getCurrentBusIteration(processedLine.schedules, now)

    const isLastBus = busIndex === scheduleForToday.times.length - 1
    const stopTimes = busIndex === false ? [] : scheduleForToday.times[busIndex]
    const subtitle = makeSubtitle({now, stopTimes, isLastBus})

    this.setState(() => ({
      subtitle: subtitle,
      schedule: scheduleForToday,
      currentBusIteration: busIndex,
    }))
  }

  keyExtractor = (item: BusTimetableEntry, index: number) => index.toString()

  renderItem = ({item, index}: {index: number, item: BusTimetableEntry}) => (
    <BusStopRow
      stop={item}
      departureIndex={this.state.currentBusIteration}
      now={this.props.now}
      barColor={this.props.line.colors.bar}
      currentStopColor={this.props.line.colors.dot}
      isFirstRow={index === 0}
      isLastRow={this.state.schedule ? index === this.state.schedule.timetable.length - 1 : true}
    />
  )

  render() {
    const {line} = this.props
    const {schedule, subtitle} = this.state

    const headerEl = (
      <ListSectionHeader
        title={line.name}
        subtitle={subtitle}
        titleStyle={Platform.OS === 'android' ? {color: line.colors.bar} : null}
      />
    )

    return (
      <FlatList
        ListHeaderComponent={headerEl}
        ListFooterComponent={FOOTER_EL}
        ListEmptyComponent={EMPTY_SCHEDULE_MESSAGE}
        ItemSeparatorComponent={BusLineSeparator}
        data={schedule ? schedule.timetable : []}
        keyExtractor={this.keyExtractor}
        extraData={this.state}
        renderItem={this.renderItem}
        onRefresh={this.props.onRefresh}
        refreshing={this.props.refreshing}
      />
    )
  }
}
