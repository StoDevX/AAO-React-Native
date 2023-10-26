/**
 * <ScheduleTable/> renders the table of schedules.
 */

import * as React from 'react'

import {Cell, Section, TableView} from '@frogpond/tableview'

import {getDayOfWeek, isScheduleOpenAtMoment} from '../lib'
import type {NamedBuildingScheduleType} from '../types'
import {ScheduleRow} from './schedule-row'
import type {Moment} from 'moment-timezone'

type Props = {
	now: Moment
	schedules: NamedBuildingScheduleType[]
	onProblemReport: () => void
}

export const ScheduleTable = (props: Props): JSX.Element => {
	let {now, schedules, onProblemReport} = props
	let dayOfWeek = getDayOfWeek(now)

	return (
		<TableView>
			{schedules.map((schedule) => (
				<Section
					key={schedule.title}
					footer={schedule.notes}
					header={schedule.title.toUpperCase()}
				>
					{schedule.hours.map((set, i) => (
						<ScheduleRow
							key={i}
							isActive={
								schedule.isPhysicallyOpen !== false &&
								set.days.includes(dayOfWeek) &&
								isScheduleOpenAtMoment(set, now)
							}
							now={now}
							set={set}
						/>
					))}
				</Section>
			))}

			<Section>
				<Cell
					accessory="DisclosureIndicator"
					onPress={onProblemReport}
					title="Suggest an Edit"
				/>
			</Section>
		</TableView>
	)
}
