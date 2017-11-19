/**
 * @flow
 *
 * <ScheduleTable/> renders the table of schedules.
 */

import * as React from 'react'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import moment from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'

type Props = {
  now: moment,
  schedules: NamedBuildingScheduleType[],
  onProblemReport: () => any,
}

export class ScheduleTable extends React.PureComponent<Props> {
  render() {
    const {now, schedules, onProblemReport} = this.props
    const dayOfWeek = getDayOfWeek(now)

    return (
      <TableView>
        {schedules.map(schedule => (
          <Section
            key={schedule.title}
            header={schedule.title.toUpperCase()}
            footer={schedule.notes}
          >
            {schedule.hours.map((set, i) => (
              <ScheduleRow
                key={i}
                now={now}
                set={set}
                isActive={
                  schedule.isPhysicallyOpen !== false &&
                  set.days.includes(dayOfWeek) &&
                  isScheduleOpenAtMoment(set, now)
                }
              />
            ))}
          </Section>
        ))}

        <Section>
          <Cell
            accessory="DisclosureIndicator"
            title="Suggest an Edit"
            onPress={onProblemReport}
          />
        </Section>
      </TableView>
    )
  }
}
