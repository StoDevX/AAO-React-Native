import React from 'react'
import {CourseType} from '../../../../lib/course-search'
import {Text, View} from 'react-native'

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
		return (
			<View>
				<Text>{course.name}</Text>
			</View>
		)
	}
}
