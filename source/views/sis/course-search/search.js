// @flow

import * as React from 'react'
import {StyleSheet, View, Animated, Dimensions, Platform} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {SearchBar} from '../../components/searchbar'
import {
	updateCourseData,
	loadCourseDataIntoMemory,
} from '../../../flux/parts/sis'
import type {CourseType} from '../../../lib/course-search'
import type {ReduxState} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import {CourseSearchResultsList} from './list'
import LoadingView from '../../components/loading'
import {deptNum} from './lib/format-dept-num'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>,
	courseDataState: string,
}

type ReduxDispatchProps = {
	updateCourseData: () => Promise<any>,
	loadCourseDataIntoMemory: () => Promise<any>,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	dataLoaded: boolean,
	searchResults: Array<{title: string, data: Array<CourseType>}>,
	searchActive: boolean,
	searchPerformed: boolean,
}

class CourseSearchView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
		title: 'SIS',
	}

	state = {
		dataLoaded: false,
		searchResults: [],
		searchActive: false,
		searchPerformed: false,
	}

	componentDidMount() {
		this.props.loadCourseDataIntoMemory().then(() => {
			this.props.updateCourseData()
			this.setState(() => ({dataLoaded: true}))
		})
	}

	animations = {
		headerOpacity: {start: 1, end: 0, duration: 200},
		searchBarTop: {start: 71, end: 10, duration: 200},
		containerHeight: {start: 125, end: 64, duration: 200},
	}

	searchBar: any = null
	headerOpacity = new Animated.Value(this.animations.headerOpacity.start)
	searchBarTop = new Animated.Value(this.animations.searchBarTop.start)
	containerHeight = new Animated.Value(this.animations.containerHeight.start)

	performSearch = (text: string | Object) => {
		const query = text.toLowerCase()
		let results = this.props.allCourses.filter(course => {
			return (
				course.name.toLowerCase().includes(query) ||
				(course.instructors || []).some(name =>
					name.toLowerCase().includes(query),
				) ||
				deptNum(course)
					.toLowerCase()
					.startsWith(query) ||
				(course.gereqs || []).some(gereq =>
					gereq.toLowerCase().startsWith(query),
				)
			)
		})

		let grouped = groupBy(results, r => r.term)
		let groupedCourses = toPairs(grouped).map(([key, value]) => ({
			title: key,
			data: value,
		}))
		let sortedCourses = sortBy(groupedCourses, course => course.title).reverse()
		this.setState(() => ({searchResults: sortedCourses, searchPerformed: true}))
	}

	onFocus = () => {
		Animated.timing(this.headerOpacity, {
			toValue: this.animations.headerOpacity.end,
			duration: this.animations.headerOpacity.duration,
		}).start()
		Animated.timing(this.searchBarTop, {
			toValue: this.animations.searchBarTop.end,
			duration: this.animations.searchBarTop.duration,
		}).start()
		Animated.timing(this.containerHeight, {
			toValue: this.animations.containerHeight.end,
			duration: this.animations.containerHeight.duration,
		}).start()
		this.setState(() => ({searchActive: true}))
	}

	onCancel = () => {
		Animated.timing(this.headerOpacity, {
			toValue: this.animations.headerOpacity.start,
			duration: this.animations.headerOpacity.duration,
		}).start()
		Animated.timing(this.searchBarTop, {
			toValue: this.animations.searchBarTop.start,
			duration: this.animations.searchBarTop.duration,
		}).start()
		Animated.timing(this.containerHeight, {
			toValue: this.animations.containerHeight.start,
			duration: this.animations.containerHeight.duration,
		}).start()
		this.setState(() => ({searchActive: false}))
	}

	render() {
		const screenWidth = Dimensions.get('window').width
		const searchBarWidth = screenWidth - 20
		const headerAnimation = {opacity: this.headerOpacity}
		const searchBarAnimation = {top: this.searchBarTop}
		const containerAnimation = {height: this.containerHeight}
		const {searchActive, searchPerformed, searchResults} = this.state
		const loadingCourseData = this.props.courseDataState === 'updating'

		if (!this.state.dataLoaded || loadingCourseData) {
			return <LoadingView text="Loading Course Data…" />
		}

		return (
			<View style={styles.container}>
				<Animated.View
					style={[styles.searchContainer, styles.common, containerAnimation]}
				>
					<Animated.Text style={[styles.header, headerAnimation]}>
						Search Courses
					</Animated.Text>
					<Animated.View
						style={[
							styles.searchBarWrapper,
							{width: searchBarWidth},
							searchBarAnimation,
						]}
					>
						<SearchBar
							getRef={ref => (this.searchBar = ref)}
							onCancel={this.onCancel}
							onFocus={this.onFocus}
							onSearchButtonPress={text => {
								if (Platform.OS === 'ios') {
									this.searchBar.blur()
								}
								this.performSearch(text)
							}}
							placeholder="Search Class & Lab"
							searchActive={searchActive}
							textFieldBackgroundColor={c.sto.lightGray}
						/>
					</Animated.View>
				</Animated.View>
				{searchActive ? (
					<CourseSearchResultsList
						navigation={this.props.navigation}
						searchPerformed={searchPerformed}
						terms={searchResults}
					/>
				) : (
					<View />
				)}
			</View>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		allCourses: state.sis ? state.sis.allCourses : [],
		courseDataState: state.sis ? state.sis.courseDataState : '',
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		loadCourseDataIntoMemory: () => dispatch(loadCourseDataIntoMemory()),
		updateCourseData: () => dispatch(updateCourseData()),
	}
}

export default connect(mapState, mapDispatch)(CourseSearchView)

let styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	common: {
		backgroundColor: c.white,
	},
	searchContainer: {
		margin: 0,
	},
	searchBarWrapper: {
		position: 'absolute',
		left: 10,
	},
	header: {
		fontSize: 30,
		fontWeight: 'bold',
		padding: 22,
		paddingLeft: 17,
	},
})
