// @flow

import * as React from 'react'
import {StyleSheet, View, Animated, Platform} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {SearchBar} from '../../components/searchbar'
import {
	updateCourseData,
	loadCourseDataIntoMemory,
} from '../../../flux/parts/sis'
import {type CourseType, areAnyTermsCached} from '../../../lib/course-search'
import type {ReduxState} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import {CourseSearchResultsList} from './list'
import LoadingView from '../../components/loading'
import {deptNum} from './lib/format-dept-num'
import {NoticeView} from '../../components/notice'
import {Viewport} from '../../components/viewport'

const PROMPT_TEXT =
	'We need to download the courses from the server. This will take a few seconds.'
const NETWORK_WARNING =
	"You'll need an internet connection to download the courses."

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>,
	courseDataState: string,
	isConnected: boolean,
}

type ReduxDispatchProps = {
	updateCourseData: () => Promise<any>,
	loadCourseDataIntoMemory: () => Promise<any>,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	dataLoading: boolean,
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
		dataLoading: true,
		searchResults: [],
		searchActive: false,
		searchPerformed: false,
	}

	componentDidMount() {
		areAnyTermsCached().then(anyTermsCached => {
			if (anyTermsCached) {
				this.loadData()
			} else {
				this.setState(() => ({dataLoading: false}))
			}
		})
	}

	loadData = () => {
		this.setState(() => ({dataLoading: true}))
		if (this.props.courseDataState !== 'ready') {
			// If the data has not been loaded into Redux State:
			// 1. load the cached courses
			// 2. if any courses are cached, hide the spinner
			// 3. either way, start updating courses in the background
			// 4. when everything is done, make sure the spinner is hidden
			this.props
				.loadCourseDataIntoMemory()
				.then(() => areAnyTermsCached())
				.then(anyTermsCached => {
					if (anyTermsCached) {
						this.doneLoading()
					}
					return this.props.updateCourseData()
				})
				.finally(() => this.doneLoading())
		} else {
			// If the course data is already in Redux State, check for update
			this.props.updateCourseData().then(() => this.doneLoading())
		}
	}

	doneLoading = () => this.setState(() => ({dataLoading: false}))

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
		const {searchActive, searchPerformed, searchResults} = this.state

		if (this.state.dataLoading) {
			return <LoadingView text="Loading Course Data…" />
		}

		if (this.props.courseDataState == 'not-loaded') {
			return (
				<NoticeView
					buttonDisabled={!this.props.isConnected}
					buttonText="Download"
					header="Almost there…"
					onPress={this.loadData}
					text={
						this.props.isConnected
							? PROMPT_TEXT
							: PROMPT_TEXT.concat(`\n\n${NETWORK_WARNING}`)
					}
				/>
			)
		}

		return (
			<Viewport
				render={viewport => {
					const searchBarWidth = viewport.width - 20

					const aniContainerStyle = [
						styles.searchContainer,
						styles.common,
						{height: this.containerHeight},
					]
					const aniSearchStyle = [
						styles.searchBarWrapper,
						{width: searchBarWidth},
						{top: this.searchBarTop},
					]
					const aniHeaderStyle = [styles.header, {opacity: this.headerOpacity}]

					return (
						<View style={styles.container}>
							<Animated.View style={aniContainerStyle}>
								<Animated.Text style={aniHeaderStyle}>
									Search Courses
								</Animated.Text>
								<Animated.View style={aniSearchStyle}>
									<SearchBar
										getRef={ref => (this.searchBar = ref)}
										onCancel={this.onCancel}
										onFocus={this.onFocus}
										onSearchButtonPress={this.onSearchButtonPress}
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
				}}
			/>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		allCourses: state.sis ? state.sis.allCourses : [],
		courseDataState: state.sis ? state.sis.courseDataState : '',
		isConnected: state.app ? state.app.isConnected : false,
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
