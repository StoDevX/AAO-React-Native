// @flow

import * as React from 'react'
import {Column, Row} from '../../components/layout'
import {ListRow, Detail, Title} from '../../components/list'
import {fastGetTrimmedText} from '../../../lib/html'
import type {JobType} from './types'

type Props = {
	onPress: JobType => any,
	job: JobType,
}

export class JobRow extends React.PureComponent<Props> {
	_onPress = () => this.props.onPress(this.props.job)

	render() {
		const {job} = this.props
		const title = fastGetTrimmedText(job.title)
		const office = fastGetTrimmedText(job.office)
		const hours = fastGetTrimmedText(job.hoursPerWeek)
		const ending = hours == 'Full-time' ? '' : 'hrs/week'

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
