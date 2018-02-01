// @flow

import React from 'react'
import {Text, View, StyleSheet, TouchableOpacity, Platform} from 'react-native'
import {CourseType, parseTerm} from '../../../lib/course-search'
import {Cell, TableView, Section} from 'react-native-tableview-simple'
import {FormattedLine} from './formatted-line'
import Icon from 'react-native-vector-icons/Ionicons'
import * as c from '../../components/colors'

type Props = {
	terms: Array<{title: string, data: Array<CourseType>}>,
}

export default class CourseSearchTableView extends React.PureComponent<
	Props,
	State,
> {
	onPress = (course: CourseType) => {
		this.props.navigation.navigate('CourseDetailView', {course: course})
	}

	renderCells = term => {
		const cells = term.data.map(course => (
			<TouchableOpacity
				key={course.clbid}
				onPress={() => {
					this.onPress(course)
				}}
			>
				<CourseCell course={course} />
			</TouchableOpacity>
		))
		return cells
	}

	renderSection = term => {
		let cells = this.renderCells(term)
		let termHeader = parseTerm(term.title)
		return (
			<Section key={term.title} header={termHeader}>
				{cells}
			</Section>
		)
	}

	render() {
		// console.log(this.props.terms)
		const sections = this.props.terms.map(term => this.renderSection(term))
		return <TableView>{sections}</TableView>
	}
}

const CourseCell = props => {
	const iconPlatform = Platform.OS === 'ios' ? 'ios' : 'md'
	const icon = `${iconPlatform}-arrow-forward`
	return (
		<Cell
			{...props}
			key={props.key}
			cellContentView={
				<View style={styles.cellContainer}>
					<View style={styles.cellContent}>
						<View>
							<Text style={styles.cellHeader}>{props.course.name}</Text>
							<Text style={styles.cellSubTitle}>
								{props.course.departments[0]} {props.course.number}
								{props.course.section}
							</Text>
							{props.course.times && (
								<Text>
									<FormattedLine items={props.course.times} />
								</Text>
							)}
							{props.course.instructors && (
								<Text>
									<FormattedLine items={props.course.instructors} />
								</Text>
							)}
							{props.course.gereqs && (
								<Text>
									<FormattedLine items={props.course.gereqs} />
								</Text>
							)}
						</View>
					</View>
					<View style={styles.arrowContainer}>
						<Icon name={icon} style={styles.arrow} />
					</View>
				</View>
			}
		/>
	)
}

const styles = StyleSheet.create({
	cellContainer: {
		padding: 5,
		flex: 1,
		flexDirection: 'row',
	},
	cellContent: {
		flex: 0.98,
	},
	arrow: {
		fontSize: 30,
		color: c.iosGray,
	},
	arrowContainer: {
		justifyContent: 'center',
	},
	cellHeader: {
		fontSize: 25,
	},
	cellSubTitle: {
		fontSize: 18,
	},
})
