/**
 * @flow
 *
 * An editor for individual building schedules.
 */

import React from 'react'
import xor from 'lodash/xor'
import {View, ScrollView, Platform, Text, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import type {SingleBuildingScheduleType, DayOfWeekEnumType} from '../types'
import {Row} from '../../components/layout'
import type {TopLevelViewPropsType} from '../../types'
import {parseHours, blankSchedule} from '../lib'
import * as c from '../../components/colors'
import DatePicker from 'react-native-datepicker'
import {Touchable} from '../../components/touchable'
import {DeleteButtonCell} from '../../components/cells/delete-button'
import {CellToggle} from '../../components/cells/toggle'
import {ListSeparator} from '../../components/list'

export class BuildingHoursScheduleEditorView extends React.PureComponent {
  static navigationOptions = {
    title: 'Edit Schedule',
  }

  props: TopLevelViewPropsType & {
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

  state: {
    set: ?SingleBuildingScheduleType,
  } = {
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
              title="Open"
              date={open}
              onChange={this.onChangeOpen}
            />
            <DatePickerCell
              title="Close"
              date={close}
              onChange={this.onChangeClose}
            />
          </Section>

          <Section>
            <DeleteButtonCell title="Delete Hours" onPress={this.delete} />
          </Section>
        </TableView>
      </ScrollView>
    )
  }
}

class WeekTogglesIOS extends React.PureComponent {
  props: {days: DayOfWeekEnumType[], onChangeDays: (DayOfWeekEnumType[]) => any}

  toggleDay = day => {
    this.props.onChangeDays(xor(this.props.days, [day]))
  }

  render() {
    const allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    return (
      <Row justifyContent="center">
        {allDays.map((day, i) =>
          <ToggleButton
            key={day}
            text={day}
            active={this.props.days.includes(day)}
            onPress={this.toggleDay}
            style={i === allDays.length - 1 && styles.finalCell}
          />,
        )}
      </Row>
    )
  }
}

class WeekTogglesAndroid extends React.PureComponent {
  props: {days: DayOfWeekEnumType[], onChangeDays: (DayOfWeekEnumType[]) => any}

  toggleDay = day => {
    this.props.onChangeDays(xor(this.props.days, [day]))
  }

  render() {
    const allDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    return (
      <View>
        {allDays.map((day, i) =>
          <View key={day}>
            <CellToggle
              key={day}
              label={day}
              value={this.props.days.includes(day)}
              onChange={() => this.toggleDay(day)}
            />
            {i === allDays.length - 1 && styles.finalCell
              ? null
              : <ListSeparator force={true} />}
          </View>,
        )}
      </View>
    )
  }
}

class ToggleButton extends React.PureComponent {
  props: {
    active: boolean,
    text: string,
    onPress: (newState: string) => any,
    style?: any,
  }

  onPress = () => this.props.onPress(this.props.text)

  render() {
    const {text, style, active} = this.props
    return (
      <Touchable
        highlight={false}
        containerStyle={[style, styles.dayWrapper, active && styles.activeDay]}
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

class DatePickerCell extends React.PureComponent {
  props: {
    date: moment,
    title: string,
    onChange?: (date: moment) => any,
    _ref?: (ref: any) => any,
  }

  _picker: any
  openPicker = () => {} //this._picker.onPressDate()

  setRef = (ref: any) => {
    this._picker = ref
    this.props._ref && this.props._ref(ref)
  }

  onChange = (newDate: moment) => {
    console.log(newDate)
    this.props.onChange && this.props.onChange(newDate)
  }

  render() {
    const {date, title} = this.props
    const accessory = (
      <Date ref={this.setRef} date={date.toDate()} onChange={this.onChange} />
    )

    return (
      <Cell
        title={title}
        cellStyle="RightDetail"
        cellAccessoryView={accessory}
        onPress={this.openPicker}
      />
    )
  }
}

const Date = ({date, onChange}) => {
  const format = 'h:mma'

  const callback = (newDateString: string) => {
    const oldMoment = moment(date)
    const newMoment = moment(newDateString, format)

    oldMoment.hours(newMoment.hours())
    oldMoment.minutes(newMoment.minutes())

    onChange(oldMoment)
  }

  return (
    <DatePicker
      date={date}
      style={styles.datePicker}
      mode="time"
      format={format}
      is24Hour={false}
      confirmBtnText="Confirm"
      cancelBtnText="Cancel"
      showIcon={false}
      onDateChange={callback}
      customStyles={{
        dateInput: styles.datePickerInput,
        dateText: styles.datePickerText,
      }}
    />
  )
}

const styles = StyleSheet.create({
  dayWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    backgroundColor: c.white,
    //borderRightWidth: StyleSheet.hairlineWidth,
    //borderRightColor: c.iosSeparator,
  },
  finalCell: {
    borderRightWidth: 0,
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
  datePicker: {
    width: null,
  },
  datePickerInput: {
    flex: 0,
    borderWidth: 0,
  },
  datePickerText: {
    color: c.iosDisabledText,
    fontSize: 16,
  },
})
