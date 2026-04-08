/**
 * <ScheduleTable/> renders the table of schedules.
 */

import * as React from 'react'
import {TableView, Section, Cell} from '@frogpond/tableview'
import type {Moment} from 'moment-timezone'
import type {NamedBuildingScheduleType} from '../types'
import {isScheduleOpenAtMoment, getDayOfWeek} from '../lib'
import {ScheduleRow} from './schedule-row'

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
