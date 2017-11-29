/**
 * @flow
 *
 * An editor for individual building schedules.
 */

import * as React from 'react'
import xor from 'lodash/xor'
import {View, ScrollView, Platform, Text, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import type {SingleBuildingScheduleType, DayOfWeekEnumType} from '../types'
import {Row} from '../../components/layout'
import type {TopLevelViewPropsType} from '../../types'
import {parseHours, blankSchedule} from '../lib'
import * as c from '../../components/colors'
import {DatePicker} from '../../components/datepicker'
import {Touchable} from '../../components/touchable'
import {DeleteButtonCell} from '../../components/cells/delete-button'
import {CellToggle} from '../../components/cells/toggle'
import {ListSeparator} from '../../components/list'

type Props = TopLevelViewPropsType & {
  navigation: {
    state: {
      params: {
        set: SingleBuildingScheduleType,
        onEditSet: (set: SingleBuildingScheduleType) => any,
        onDeleteSet: () => any,
      },
    },
  },
}

type State = {
  set: ?SingleBuildingScheduleType,
}

export class BuildingHoursScheduleEditorView extends React.PureComponent<
  Props,
  State,
> {
  static navigationOptions = {
    title: 'Edit Schedule',
  }

  state = {
    set: this.props.navigation.state.params.initialSet,
  }

  delete = () => {
    this.props.navigation.state.params.onDeleteSet()
    this.props.navigation.goBack()
  }

  onChangeDays = (newDays: DayOfWeekEnumType[]) => {
    this.setState(
      state => ({...state, set: {...state.set, days: newDays}}),
      () => this.props.navigation.state.params.onEditSet(this.state.set),
    )
  }

  onChangeOpen = (newDate: moment) => {
    this.setState(
      state => ({...state, set: {...state.set, from: newDate.format('h:mma')}}),
      () => this.props.navigation.state.params.onEditSet(this.state.set),
    )
  }

  onChangeClose = (newDate: moment) => {
    this.setState(
      state => ({...state, set: {...state.set, to: newDate.format('h:mma')}}),
      () => this.props.navigation.state.params.onEditSet(this.state.set),
    )
  }

  render() {
    const set = this.state.set || blankSchedule()

    const {open, close} = parseHours(set, moment())

    return (
      <ScrollView>
        <TableView>
          <Section header="DAYS">
            <WeekToggles days={set.days} onChangeDays={this.onChangeDays} />
          </Section>

          <Section header="TIMES">
            <DatePickerCell
              date={open}
              onChange={this.onChangeOpen}
              title="Open"
            />
            <DatePickerCell
              date={close}
              onChange={this.onChangeClose}
              title="Close"
            />
          </Section>

          <Section>
            <DeleteButtonCell onPress={this.delete} title="Delete Hours" />
          </Section>
        </TableView>
      </ScrollView>
    )
  }
}

type WeekTogglesProps = {
  days: DayOfWeekEnumType[],
  onChangeDays: (DayOfWeekEnumType[]) => any,
}

class WeekTogglesIOS extends React.PureComponent<WeekTogglesProps> {
  toggleDay = (day: DayOfWeekEnumType) => {
    this.props.onChangeDays(xor(this.props.days, [day]))
  }

  render() {
    const allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    return (
      <Row alignItems="stretch" justifyContent="center">
        {allDays.map(day => (
          <ToggleButton
            key={day}
            active={this.props.days.includes(day)}
            onPress={this.toggleDay}
            text={day}
          />
        ))}
      </Row>
    )
  }
}

class WeekTogglesAndroid extends React.PureComponent<WeekTogglesProps> {
  toggleDay = day => {
    this.props.onChangeDays(xor(this.props.days, [day]))
  }

  render() {
    const allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    return (
      <View>
        {allDays.map((day, i) => (
          <View key={day}>
            <CellToggle
              key={day}
              label={day}
              onChange={() => this.toggleDay(day)}
              value={this.props.days.includes(day)}
            />
            {i === allDays.length - 1 ? null : <ListSeparator force={true} />}
          </View>
        ))}
      </View>
    )
  }
}

type ToggleButtonProps = {
  active: boolean,
  text: DayOfWeekEnumType,
  onPress: (newState: DayOfWeekEnumType) => any,
}

class ToggleButton extends React.PureComponent<ToggleButtonProps> {
  onPress = () => this.props.onPress(this.props.text)

  render() {
    const {text, active} = this.props
    return (
      <Touchable
        containerStyle={[styles.dayWrapper, active && styles.activeDay]}
        highlight={false}
        onPress={this.onPress}
      >
        <Text style={[styles.dayText, active && styles.activeDayText]}>
          {text}
        </Text>
      </Touchable>
    )
  }
}

const WeekToggles = Platform.OS === 'ios' ? WeekTogglesIOS : WeekTogglesAndroid

type DatePickerCellProps = {
  date: moment,
  title: string,
  onChange: (date: moment) => any,
}

class DatePickerCell extends React.PureComponent<DatePickerCellProps> {
  _picker: any
  openPicker = () => this._picker.onPressDate()

  getRef = (ref: any) => (this._picker = ref)

  onChange = (newDate: moment) => {
    const oldMoment = moment()

    oldMoment.hours(newDate.hours())
    oldMoment.minutes(newDate.minutes())

    this.props.onChange(oldMoment)
  }

  render() {
    const format = 'h:mm A'

    const accessory = (
      <DatePicker
        ref={this.getRef}
        format={format}
        initialDate={this.props.date}
        minuteInterval={5}
        mode="time"
        onDateChange={this.onChange}
      />
    )

    return (
      <Cell
        cellAccessoryView={accessory}
        cellStyle="RightDetail"
        onPress={this.openPicker}
        title={this.props.title}
      />
    )
  }
}

const styles = StyleSheet.create({
  dayWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    backgroundColor: c.white,
  },
  activeDay: {
    backgroundColor: c.brickRed,
  },
  dayText: {
    fontSize: 16,
  },
  activeDayText: {
    color: c.white,
  },
})
