import * as React from 'react'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import {fastGetTrimmedText} from '@frogpond/html-lib'
import type {JobType} from './types'

type Props = {
	onPress: (job: JobType) => any
	job: JobType
}

export class JobRow extends React.PureComponent<Props> {
	_onPress = () => this.props.onPress(this.props.job)

	render() {
		let {job} = this.props
		let title = fastGetTrimmedText(job.title)
		let office = fastGetTrimmedText(job.office)
		let hours = fastGetTrimmedText(job.hoursPerWeek)
		let ending = hours === 'Full-time' ? '' : 'hrs/week'

		return (
			<ListRow arrowPosition="top" onPress={this._onPress}>
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
}
