// @flow

import * as React from 'react'
import {StyleSheet, View, ScrollView} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {
	updateCourseData,
	loadCourseDataIntoMemory,
	updateRecentSearches,
	updateRecentFilters,
} from '../../../flux/parts/courses'
import {areAnyTermsCached} from '../../../lib/course-search'
import type {ReduxState} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import {AnimatedSearchbox} from '../components/animated-searchbox'
import {type FilterType} from '../../components/filter'
import {RecentItemsList} from '../components/recents-list'
import {Separator} from '../../components/separator'
import {buildFilters} from './lib/build-filters'
import type {FilterComboType} from './lib/format-filter-combo'
import fromPairs from 'lodash/fromPairs'

const PROMPT_TEXT =
	'We need to download the courses from the server. This will take a few seconds.'
const NETWORK_WARNING =
	"You'll need an internet connection to download the courses."

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	courseDataState: string,
	isConnected: boolean,
	recentFilters: FilterComboType[],
	recentSearches: string[],
}

type ReduxDispatchProps = {
	updateCourseData: () => Promise<any>,
	loadCourseDataIntoMemory: () => Promise<any>,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	isLoaded: boolean,
	isSearchbarActive: boolean,
	typedQuery: string,
}

class CourseSearchView extends React.Component<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
		title: 'SIS',
	}

	state = {
		isLoaded: false,
		isSearchbarActive: false,
		typedQuery: '',
	}

	componentDidMount() {
		this.loadData()
	}

	loadData = async () => {
		this.setState(() => ({isLoaded: false}))

		// If the data has not been loaded into Redux State:
		if (this.props.courseDataState !== 'ready') {
			// 1. load the cached courses
			await this.props.loadCourseDataIntoMemory()

			// 2. if any courses are cached, hide the spinner
			if (await areAnyTermsCached()) {
				this.setState(() => ({isLoaded: true}))
			}

			// 3. either way, start updating courses in the background
			await this.props.updateCourseData()
		} else {
			// If the course data is already in Redux State, check for update
			await this.props.updateCourseData()
		}

		// 4. when everything is done, make sure the spinner is hidden
		this.setState(() => ({isLoaded: true}))
	}

	handleSearchSubmit = () => {
		this.setState(() => ({isSearchbarActive: false}))
		this.props.navigation.push('CourseSearchResultsView', {
			initialQuery: this.state.typedQuery,
		})
	}

	handleSearchCancel = () => {
		this.setState(() => ({typedQuery: '', isSearchbarActive: false}))
	}

	handleSearchChange = (value: string) => {
		this.setState(() => ({typedQuery: value}))
	}

	handleSearchFocus = () => {
		this.setState(() => ({isSearchbarActive: true}))
	}

	browseAll = () => {
		this.props.navigation.push('CourseSearchResultsView', {initialQuery: ''})
	}

	onRecentSearchPress = (text: string) => {
		this.props.navigation.push('CourseSearchResultsView', {initialQuery: text})
	}

	onRecentFilterPress = async (text: string) => {
		let {recentFilters} = this.props
		let selectedFilterCombo = recentFilters.find(f => f.description === text)

		let freshFilters = await buildFilters()
		let selectedFilters = freshFilters
		if (selectedFilterCombo) {
			let filterLookup = fromPairs(
				selectedFilterCombo.filters.map(f => [f.key, f]),
			)
			selectedFilters = freshFilters.map(f => filterLookup[f.key] || f)
		}

		this.props.navigation.push('CourseSearchResultsView', {
			initialFilters: selectedFilters,
		})
	}

	render() {
		let {typedQuery, isLoaded, isSearchbarActive} = this.state

		if (!isLoaded) {
			return <LoadingView text="Loading Course Data…" />
		}

		if (this.props.courseDataState === 'not-loaded') {
			let msg = this.props.isConnected
				? PROMPT_TEXT
				: PROMPT_TEXT.concat(`\n\n${NETWORK_WARNING}`)

			return (
				<NoticeView
					buttonDisabled={!this.props.isConnected}
					buttonText="Download"
					header="Almost there…"
					onPress={this.loadData}
					text={msg}
				/>
			)
		}

		let recentFilterDescriptions = this.props.recentFilters.map(
			f => f.description,
		)

		return (
			<View style={[styles.container, styles.common]}>
				<AnimatedSearchbox
					active={isSearchbarActive}
					onCancel={this.handleSearchCancel}
					onChange={this.handleSearchChange}
					onFocus={this.handleSearchFocus}
					onSubmit={this.handleSearchSubmit}
					placeholder="Search Class & Lab"
					title="Search Courses"
					value={typedQuery}
				/>

				<Separator />

				<ScrollView
					keyboardDismissMode="interactive"
					style={[styles.common, styles.bottomContainer]}
				>
					<RecentItemsList
						emptyHeader="No recent searches"
						emptyText="Your recent searches will appear here."
						items={this.props.recentSearches}
						onItemPress={this.onRecentSearchPress}
						title="Recent"
					/>
					<RecentItemsList
						actionLabel="Browse All"
						emptyHeader="No recent filter combinations"
						emptyText="Your recent filter combinations will appear here."
						items={recentFilterDescriptions}
						onAction={this.browseAll}
						onItemPress={this.onRecentFilterPress}
						title="Browse"
					/>
				</ScrollView>
			</View>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		isConnected: state.app ? state.app.isConnected : false,
		courseDataState: state.courses ? state.courses.readyState : '',
		recentFilters: state.courses ? state.courses.recentFilters : [],
		recentSearches: state.courses ? state.courses.recentSearches : [],
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		loadCourseDataIntoMemory: () => dispatch(loadCourseDataIntoMemory()),
		updateCourseData: () => dispatch(updateCourseData()),
		updateRecentSearches: (query: string) =>
			dispatch(updateRecentSearches(query)),
		updateRecentFilters: (filters: FilterType[]) =>
			dispatch(updateRecentFilters(filters)),
	}
}

export default connect(
	mapState,
	mapDispatch,
)(CourseSearchView)

let styles = StyleSheet.create({
	bottomContainer: {
		paddingTop: 12,
	},
	container: {
		flex: 1,
	},
	common: {
		backgroundColor: c.white,
	},
})
