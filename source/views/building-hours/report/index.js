/**
 * @flow
 *
 * Building Hours "report a problem" screen.
 */

import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import type {BuildingType, NamedBuildingScheduleType} from '../types'
import type {TopLevelViewPropsType} from '../../types'

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

  onChangeSchedule = (index: number, newSchedule: NamedBuildingScheduleType) => {
    this.setState(state => {
      const schedule = [...state.building.schedule]
      schedule.splice(index, 1, newSchedule)
      return {building: {...state.building, schedule}}
    })
  }

  render() {
    console.log(this.state.building)

    return (
      <ScrollView>
        <Text>
          Thanks for spotting a problem! If you could tell us what the new times
          are, we'd greatly appreciate it.
        </Text>

        <TableView>
          {this.state.building.schedule}
          <EditableSchedule schedule={{}} />
        </TableView>
      </ScrollView>
    )
  }
}

class EditableSchedule extends React.PureComponent {
  render() {
    return (
      <Section header="KITCHEN">

        <TitleCell text="Kitchen" />

        <TimesCell days="Mon-Thu" times="7:30AM — 8PM" />
        <TimesCell days="Friday" times="7:30AM — 8PM" />
        <TimesCell days="Saturday" times="9AM — 8PM" />
        <TimesCell days="Sunday" times="9AM — 8PM" />

        <AddScheduleCell />

        <NotesCell text="The kitchen stops cooking at 8 p.m." />
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
