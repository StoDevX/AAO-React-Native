import * as React from 'react'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import type {JobType} from './types'

type Props = {
	onPress: (job: JobType) => any
	job: JobType
}

export class JobRow extends React.PureComponent<Props> {
	_onPress = () => this.props.onPress(this.props.job)

	render() {
		let {job} = this.props
		let ending = job.hoursPerWeek === 'Full-time' ? '' : 'hrs/week'

		return (
			<ListRow arrowPosition="top" onPress={this._onPress}>
				<Row alignItems="center">
					<Column flex={1}>
						<Title lines={1}>{job.title}</Title>
						<Detail lines={1}>{job.office}</Detail>
						<Detail lines={1}>
							{job.hoursPerWeek} {ending}
						</Detail>
					</Column>
				</Row>
			</ListRow>
		)
	}
}
