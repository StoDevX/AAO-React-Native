import * as React from 'react'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import {fastGetTrimmedText} from '@frogpond/html-lib'
import type {JobType} from './types'

type Props = {
	onPress: (job: JobType) => void
	job: JobType
}

export const JobRow = (props: Props): JSX.Element => {
	let _onPress = () => props.onPress(props.job)

	let {job} = props
	let title = fastGetTrimmedText(job.title)
	let office = fastGetTrimmedText(job.office)
	let hours = fastGetTrimmedText(job.hoursPerWeek)
	let ending = hours === 'Full-time' ? '' : 'hrs/week'

	return (
		<ListRow arrowPosition="top" onPress={_onPress}>
			<Row alignItems="center">
				<Column flex={1}>
					<Title lines={1}>{title}</Title>
					<Detail lines={1}>{office}</Detail>
					<Detail lines={1}>
						{hours} {ending}
					</Detail>
				</Column>
			</Row>
		</ListRow>
	)
}
