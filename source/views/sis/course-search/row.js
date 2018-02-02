// @flow

import * as React from 'react'
import {Text} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListRow, Title} from '../../components/list'
import {Row} from '../../components/layout'
import {FormattedLine} from '../components/formatted-line'

type Props = {
	course: CourseType,
	onPress: CourseType => any,
}

export class CourseRow extends React.PureComponent<Props> {
	onPress = () => {
		this.props.onPress(this.props.course)
	}

	render() {
		const {course} = this.props
		return (
			<ListRow arrowPosition="center" onPress={this.onPress}>
				<Row>
					<Title lines={1}>
						<Text>{course.name}</Text>
					</Title>
				</Row>
				<Text>
					{course.departments[0]} {course.number}
					{course.section}
				</Text>
				{course.times && (
					<Text>
						<FormattedLine items={course.times} />
					</Text>
				)}
				{course.instructors && (
					<Text>
						<FormattedLine items={course.instructors} />
					</Text>
				)}
				{course.gereqs && (
					<Text>
						<FormattedLine items={course.gereqs} />
					</Text>
				)}
			</ListRow>
		)
	}
}
