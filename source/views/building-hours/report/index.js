/**
 * @flow
 *
 * Building Hours "report a problem" screen.
 */

import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import moment from 'moment-timezone'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import type {BuildingType, NamedBuildingScheduleType} from '../types'
import type {TopLevelViewPropsType} from '../../types'
import {summarizeDays, formatBuildingTimes} from '../lib'

export class BuildingHoursProblemReportView extends React.PureComponent {
  static navigationOptions = {
    title: 'Report a Problem',
  }

  state: {
    building: BuildingType,
  } = {
    building: this.props.navigation.state.params.initialBuilding,
  }

  props: TopLevelViewPropsType & {
    navigation: {state: {params: {initialBuilding: BuildingType}}},
  }

  onChangeSchedule = (
    index: number,
    newSchedule: NamedBuildingScheduleType,
  ) => {
    this.setState(state => {
      const schedule = [...state.building.schedule]
      schedule.splice(index, 1, newSchedule)
      return {building: {...state.building, schedule}}
    })
  }

  render() {
    const schedules = this.state.building.schedule || []

    return (
      <ScrollView>
        <Text>
          Thanks for spotting a problem! If you could tell us what the new times
          are, we'd greatly appreciate it.
        </Text>

        <TableView>
          {schedules.map(s => <EditableSchedule key={s.title} schedule={s} />)}
        </TableView>
      </ScrollView>
    )
  }
}

class EditableSchedule extends React.PureComponent {
  props: {
    schedule: NamedBuildingScheduleType,
  }

  render() {
    const {schedule} = this.props
    const now = moment()

    return (
      <Section header={schedule.title.toUpperCase()} footer={schedule.notes}>
        <TitleCell text={schedule.title} />

        {schedule.hours.map((set, i) =>
          <TimesCell
            key={i}
            days={summarizeDays(set.days)}
            times={formatBuildingTimes(set, now)}
          />,
        )}

        <AddScheduleCell />

        <NotesCell text={schedule.notes} />
      </Section>
    )
  }
}

// "Title" will become a textfield like the login form
const TitleCell = ({text, onChange}) =>
  <Cell title="Title" cellStyle="RightDetail" detail={text} />

// "Notes" will become a big textarea
const NotesCell = ({text, onChange}) =>
  <Cell title="Notes" cellStyle="Subtitle" detail={text} />

const AddScheduleCell = () =>
  <Cell title="Add Schedule" accessory="DisclosureIndicator" />

const TimesCell = ({days, times, onPress}) =>
  <Cell
    title={days}
    accessory="Detail"
    cellStyle="RightDetail"
    detail={times}
  />
