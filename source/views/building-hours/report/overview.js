/**
 * @flow
 *
 * Building Hours "report a problem" screen.
 */

import React from 'react'
import {ScrollView, View, Text} from 'react-native'
import moment from 'moment-timezone'
import {CellTextField} from '../../components/cells/textfield'
import {CellToggle} from '../../components/cells/toggle'
import {DeleteButtonCell} from '../../components/cells/delete-button'
import {ButtonCell} from '../../components/cells/button'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import type {
  BuildingType,
  NamedBuildingScheduleType,
  SingleBuildingScheduleType,
} from '../types'
import type {TopLevelViewPropsType} from '../../types'
import {summarizeDays, formatBuildingTimes, blankSchedule} from '../lib'

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

  openEditor = (
    scheduleIdx: number,
    setIdx: number,
    set: ?SingleBuildingScheduleType = null,
  ) => {
    this.props.navigation.navigate('BuildingHoursScheduleEditorView', {
      initialSet: set,
      onEditSet: (editedData: SingleBuildingScheduleType) =>
        this.editHoursRow(scheduleIdx, setIdx, editedData),
      onDeleteSet: () => this.deleteHoursRow(scheduleIdx, setIdx),
    })
  }

  editSchedule = (idx: number, newSchedule: NamedBuildingScheduleType) => {
    this.setState(state => {
      const schedules = [...state.building.schedule]
      schedules.splice(idx, 1, newSchedule)

      return {
        ...state,
        building: {
          ...state.building,
          schedule: schedules,
        },
      }
    })
  }

  deleteSchedule = (idx: number) => {
    this.setState(state => {
      const schedules = [...state.building.schedule]
      schedules.splice(idx, 1)

      return {
        ...state,
        building: {
          ...state.building,
          schedule: schedules,
        },
      }
    })
  }

  addSchedule = () => {
    this.setState(state => {
      return {
        ...state,
        building: {
          ...state.building,
          schedule: [
            ...state.building.schedule,
            {
              title: 'Hours',
              hours: [blankSchedule()],
            },
          ],
        },
      }
    })
  }

  addHoursRow = (idx: number) => {
    this.setState(state => {
      const schedules = [...state.building.schedule]

      schedules[idx] = {
        ...schedules[idx],
        hours: [...schedules[idx].hours, blankSchedule()],
      }

      return {
        ...state,
        building: {
          ...state.building,
          schedule: schedules,
        },
      }
    })
  }

  editHoursRow = (
    scheduleIdx: number,
    setIdx: number,
    newData: SingleBuildingScheduleType,
  ) => {
    this.setState(state => {
      const schedules = [...state.building.schedule]

      const hours = [...schedules[scheduleIdx].hours]
      hours.splice(setIdx, 1, newData)

      schedules[scheduleIdx] = {...schedules[scheduleIdx], hours}

      return {
        ...state,
        building: {
          ...state.building,
          schedule: schedules,
        },
      }
    })
  }

  deleteHoursRow = (scheduleIdx: number, setIdx: number) => {
    this.setState(state => {
      const schedules = [...state.building.schedule]

      const hours = [...schedules[scheduleIdx].hours]
      hours.splice(setIdx, 1)

      schedules[scheduleIdx] = {...schedules[scheduleIdx], hours}

      return {
        ...state,
        building: {
          ...state.building,
          schedule: schedules,
        },
      }
    })
  }

  submit = () => {
    console.log(JSON.stringify(this.state.building))
  }

  render() {
    const {schedule: schedules = []} = this.state.building

    return (
      <ScrollView>
        <Text>
          Thanks for spotting a problem! If you could tell us what the new times
          are, we&rsquo;d greatly appreciate it.
        </Text>

        <TableView>
          {schedules.map((s, i) =>
            <EditableSchedule
              key={i}
              schedule={s}
              scheduleIndex={i}
              addRow={this.addHoursRow}
              editRow={this.openEditor}
              onEditSchedule={this.editSchedule}
              onDelete={this.deleteSchedule}
            />,
          )}

          <Section>
            <Cell
              title="Add New Schedule"
              accessory="DisclosureIndicator"
              onPress={this.addSchedule}
            />
          </Section>

          <Section footer="Thanks for reporting!">
            <ButtonCell title="Submit Report" onPress={this.submit} />
          </Section>
        </TableView>
      </ScrollView>
    )
  }
}

class EditableSchedule extends React.PureComponent {
  props: {
    schedule: NamedBuildingScheduleType,
    scheduleIndex: number,
    addRow: (idx: number) => any,
    editRow: (
      schedIdx: number,
      setIdx: number,
      set: SingleBuildingScheduleType,
    ) => any,
    onEditSchedule: (idx: number, set: NamedBuildingScheduleType) => any,
    onDelete: (idx: number) => any,
  }

  onEdit = data => {
    const idx = this.props.scheduleIndex
    this.props.onEditSchedule(idx, {
      ...this.props.schedule,
      ...data,
    })
  }

  editTitle = (newValue: string) => {
    this.onEdit({title: newValue})
  }

  editNotes = (newValue: string) => {
    this.onEdit({notes: newValue})
  }

  toggleChapel = (newValue: boolean) => {
    this.onEdit({closedForChapelTime: newValue})
  }

  addHoursRow = () => {
    this.props.addRow(this.props.scheduleIndex)
  }

  delete = () => {
    this.props.onDelete(this.props.scheduleIndex)
  }

  openEditor = (setIndex: number, hoursSet: SingleBuildingScheduleType) => {
    this.props.editRow(this.props.scheduleIndex, setIndex, hoursSet)
  }

  render() {
    const {schedule} = this.props
    const now = moment()

    return (
      <View>
        <Section header="INFORMATION">
          <TitleCell text={schedule.title} onChange={this.editTitle} />
          <NotesCell text={schedule.notes} onChange={this.editNotes} />

          <CellToggle
            label="Closes for Chapel"
            value={Boolean(schedule.closedForChapelTime)}
            onChange={this.toggleChapel}
          />

          {schedule.hours.map((set, i) =>
            <TimesCell
              key={i}
              set={set}
              setIndex={i}
              onPress={this.openEditor}
              now={now}
            />,
          )}

          <Cell
            title="Add More Hours"
            accessory="DisclosureIndicator"
            onPress={this.addHoursRow}
          />

          <DeleteButtonCell title="Delete Schedule" onPress={this.delete} />
        </Section>
      </View>
    )
  }
}

// "Title" will become a textfield like the login form
const TitleCell = ({text, onChange = () => {}}) =>
  <CellTextField
    hideLabel={true}
    returnKeyType="done"
    placeholder="Title"
    value={text}
    onChangeText={onChange}
    onSubmitEditing={onChange}
  />

// "Notes" will become a big textarea
const NotesCell = ({text, onChange}) =>
  <CellTextField
    hideLabel={true}
    returnKeyType="done"
    placeholder="Notes"
    value={text}
    onChangeText={onChange}
    onSubmitEditing={onChange}
  />

class TimesCell extends React.PureComponent {
  props: {
    set: SingleBuildingScheduleType,
    setIndex: number,
    onPress: (setIdx: number, set: SingleBuildingScheduleType) => any,
    now: moment,
  }

  onPress = () => {
    this.props.onPress(this.props.setIndex, this.props.set)
  }

  render() {
    const {set, now} = this.props

    return (
      <Cell
        title={set.days.length ? summarizeDays(set.days) : 'Days'}
        accessory="DisclosureIndicator"
        cellStyle="RightDetail"
        detail={formatBuildingTimes(set, now)}
        onPress={this.onPress}
      />
    )
  }
}
