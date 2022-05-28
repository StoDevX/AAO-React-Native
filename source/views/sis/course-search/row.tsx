import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListRow, Title, Detail} from '@frogpond/lists'
import {deptNum} from './lib/format-dept-num'
import {Row} from '@frogpond/layout'

type Props = {
	course: CourseType
	onPress: (course: CourseType) => any
}

export class CourseRow extends React.PureComponent<Props> {
	onPress = () => {
		this.props.onPress(this.props.course)
	}

	render() {
		let {course} = this.props

		return (
			<ListRow arrowPosition="center" onPress={this.onPress}>
				<Title lines={1}>{course.name}</Title>

				<Row>
					<Detail style={styles.bold}>{deptNum(course)}</Detail>

					{course.gereqs && (
						<Detail style={styles.ges}>({course.gereqs.join(', ')})</Detail>
					)}
				</Row>

				{course.instructors && (
					<Detail style={styles.row}>{course.instructors.join(', ')}</Detail>
				)}

				{course.notes && (
					<Detail lines={1} style={[styles.italics, styles.row]}>
						{course.notes.join(' ')}
					</Detail>
				)}
			</ListRow>
		)
	}
}

const styles = StyleSheet.create({
	bold: {
		fontWeight: 'bold',
	},
	italics: {
		fontStyle: 'italic',
	},
	ges: {
		marginLeft: 4,
	},
	row: {
		marginTop: -4,
	},
})
