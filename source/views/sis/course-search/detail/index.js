// @flow

import React from 'react'
import type {CourseType} from '../../../../lib/course-search'
import glamorous from 'glamorous-native'
import {Badge} from '../../../building-hours/detail/badge'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import {convertTimeStringsToOfferings} from 'sto-sis-time-parser'
import moment from 'moment-timezone'
import {formatDay} from '../lib/format-day'
import {
	MultiLineDetailCell,
	MultiLineLeftDetailCell,
} from '../../components/multi-line-cell'
import type {TopLevelViewPropsType} from '../../../types'
import * as c from '../../../components/colors'
import {deptNum} from '../'
const CENTRAL_TZ = 'America/Winnipeg'

const Container = glamorous.scrollView({
	paddingVertical: 6,
})

const Header = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginTop: 20,
	marginHorizontal: 10,
	color: c.black,
})

const SubHeader = glamorous.text({
	fontSize: 21,
	textAlign: 'center',
	marginTop: 5,
})

const CellText = glamorous.text({
	padding: 5,
	color: c.black,
})

function Information({course}: {course: CourseType}) {
	return (
		<Section header="COURSE INFORMATION" sectionTintColor={c.sectionBgColor}>
			{course.instructors ? (
				<Cell
					cellStyle="LeftDetail"
					detail="Instructor(s)"
					title={course.instructors.join(', ')}
				/>
			) : null}
			<Cell cellStyle="LeftDetail" detail="Type" title={course.type} />
			{course.gereqs ? (
				<Cell
					cellStyle="LeftDetail"
					detail="GEs"
					title={course.gereqs.join(', ')}
				/>
			) : null}
			{course.pn ? (
				<Cell
					cellStyle="LeftDetail"
					detail="Pass/Fail"
					title={course.pn ? 'Yes' : 'No'}
				/>
			) : null}
			<MultiLineLeftDetailCell
				detail="Prerequisites"
				title={course.prerequisites ? course.prerequisites : 'None'}
			/>
			{course.credits ? (
				<Cell cellStyle="LeftDetail" detail="Credits" title={course.credits} />
			) : null}
		</Section>
	)
}

function Schedule({course}: {course: CourseType}) {
	if (!course.times) {
		return null
	}
	const times = convertTimeStringsToOfferings({
		times: course.times,
		locations: course.locations,
	})
	const schedule = times.map(time => {
		const hours = time.times.map(time => {
			const start = moment.tz(time.start, 'hmm', CENTRAL_TZ).format('h:mm A')
			const end = moment.tz(time.end, 'hmm', CENTRAL_TZ).format('h:mm A')
			return `${start} - ${end}`
		})
		return (
			<MultiLineDetailCell
				key={time.day}
				leftDetail={time.location}
				rightDetail={hours.join('\n')}
				title={formatDay(time.day)}
			/>
		)
	})

	return (
		<Section header="SCHEDULE" sectionTintColor={c.sectionBgColor}>
			{schedule}
		</Section>
	)
}

function Description({course}: {course: CourseType}) {
	return course.description ? (
		<Section header="DESCRIPTION" sectionTintColor={c.sectionBgColor}>
			<Cell cellContentView={<CellText>{course.description[0]}</CellText>} />
		</Section>
	) : null
}

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {course: CourseType}}},
}

export class CourseDetailView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: any) => {
		const course = navigation.state.params.course
		return {
			title: course.name,
		}
	}

	render() {
		const course = this.props.navigation.state.params.course
		const status = course.status === 'O' ? 'Open' : 'Closed'
		return (
			<Container>
				<Header>{course.title || course.name}</Header>
				<SubHeader>{deptNum(course)}</SubHeader>
				<Badge status={status} />
				<TableView>
					<Information course={course} />
					<Schedule course={course} />
					<Description course={course} />
				</TableView>
			</Container>
		)
	}
}
