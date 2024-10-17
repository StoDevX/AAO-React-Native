import * as React from 'react'
import {StyleSheet} from 'react-native'
import type {CourseType} from '../../../lib/course-search/types'
import {ListRow, Title, Detail} from '@frogpond/lists'
import {deptNum} from './lib/format-dept-num'
import {Row} from '@frogpond/layout'

interface Props {
	course: CourseType
	onPress: (course: CourseType) => void
}

export const CourseRow = (props: Props): React.JSX.Element => {
	let {course} = props

	let onPress = (): void => {
		props.onPress(course)
	}

	return (
		<ListRow arrowPosition="center" onPress={onPress}>
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
