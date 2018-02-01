// @flow

import React from 'react'
import {CourseType} from '../../../../lib/course-search'
import glamorous from 'glamorous-native'
import {Badge} from '../../../building-hours/detail/badge'
import {TableView, Section, Cell} from 'react-native-tableview-simple'
import {convertTimeStringsToOfferings} from 'sto-sis-time-parser'
import moment from 'moment-timezone'
import {formatDay} from '../lib/format-day'
import {MultiLineDetailCell} from '../../components/multi-line-cell'
import type {TopLevelViewPropsType} from '../../../types'

const Container = glamorous.scrollView({
	paddingVertical: 6,
})

const Header = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginTop: 20,
	marginHorizontal: 10,
})

const SubHeader = glamorous.text({
	fontSize: 21,
	textAlign: 'center',
	marginTop: 5,
})

const CellText = glamorous.text({
	padding: 5,
})

function Information({course}: {course: CourseType}) {
	const profs = course.instructors ? course.instructors.join(', ') : null
	const instructors = course.instructors ? (
		<Cell cellStyle="LeftDetail" detail="Instructor(s)" title={profs} />
	) : null
	const gereqs = course.gereqs ? course.gereqs.join(', ') : null
	const ges = course.gereqs ? (
		<Cell cellStyle="LeftDetail" detail="GE's" title={gereqs} />
	) : null
	const credits = course.credits ? (
		<Cell cellStyle="LeftDetail" detail="Credits" title={course.credits} />
	) : null
	return (
		<Section header="Course Information">
			{instructors}
			{credits}
			{ges}
		</Section>
	)
}

function Schedule({course}: {course: CourseType}) {
	if (!course.times) {
		return null
	}
	const times = convertTimeStringsToOfferings({times: course.times})
	const schedule = times.map(time => {
		const hours = time.times.map(time => {
			const start = moment(time.start, 'hmm').format('h:mm A')
			const end = moment(time.end, 'hmm').format('h:mm A')
			return `${start} - ${end}`
		})
		const allHours = hours.join('\n')
		const day = formatDay(time.day)
		return <MultiLineDetailCell key={time.day} detail={allHours} title={day} />
	})

	return <Section header="Schedule">{schedule}</Section>
}

function Description({course}: {course: CourseType}) {
	return course.description ? (
		<Section header="Description">
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
				<Header>{course.name}</Header>
				<SubHeader>
					{course.departments[0]} {course.number}
					{course.section}
				</SubHeader>
				<Badge status={status} />
				<TableView>
					<Information course={course} />
					<Description course={course} />
					<Schedule course={course} />
				</TableView>
			</Container>
		)
	}
}
