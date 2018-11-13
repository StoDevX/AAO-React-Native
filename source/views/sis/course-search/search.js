// @flow

import * as React from 'react'
import {StyleSheet, View, ScrollView} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import * as c from '@frogpond/colors'
import {
	updateCourseData,
	loadCourseDataIntoMemory,
	updateRecentSearches,
	updateRecentFilters,
} from '../../../redux/parts/courses'
import {areAnyTermsCached} from '../../../lib/course-search'
import type {ReduxState} from '../../../redux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {AnimatedSearchBar} from '@frogpond/searchbar'
import {type FilterType} from '@frogpond/filter'
import {RecentItemsList} from '../components/recents-list'
import {Separator} from '@frogpond/separator'
import {buildFilters} from './lib/build-filters'
import type {FilterComboType} from './lib/format-filter-combo'
import fromPairs from 'lodash/fromPairs'

const PROMPT_TEXT =
	'We need to download the courses from the server. This will take a few seconds.'
const NETWORK_WARNING =
	'(Please make sure that you are connected to the Internet before downloading the courses).'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	courseDataState: string,
	recentFilters: FilterComboType[],
	recentSearches: string[],
}

type ReduxDispatchProps = {
	updateCourseData: () => Promise<any>,
	loadCourseDataIntoMemory: () => Promise<any>,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	mode: 'loading' | 'pending' | 'ready',
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
		mode: 'pending',
		isSearchbarActive: false,
		typedQuery: '',
	}

	componentDidMount() {
		this.loadData({userInitiated: false})
	}

	loadData = async ({userInitiated = true} = {}) => {
		let hasCache = await areAnyTermsCached()

		if (!hasCache && !userInitiated) {
			// if no terms are cached, and the user didn't push the button,
			// then don't download anything.
			this.setState(() => ({mode: 'pending'}))
			return
		}

		this.setState(() => ({mode: 'loading'}))

		// If the data has not been loaded into Redux State:
		if (this.props.courseDataState !== 'ready') {
			// 1. load the cached courses
			await this.props.loadCourseDataIntoMemory()

			// 2. if any courses are cached, hide the spinner
			if (hasCache) {
				this.setState(() => ({mode: 'ready'}))
			}

			// 3. either way, start updating courses in the background
			await this.props.updateCourseData()
		} else {
			// If the course data is already in Redux State, check for update
			await this.props.updateCourseData()
		}

		// 4. when everything is done, make sure the spinner is hidden
		this.setState(() => ({mode: 'ready'}))
	}

	handleSearchSubmit = () => {
		this.props.navigation.push('CourseSearchResultsView', {
			initialQuery: this.state.typedQuery,
		})
		this.setState(() => ({isSearchbarActive: false, typedQuery: ''}))
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
		let {typedQuery, mode, isSearchbarActive} = this.state

		if (mode === 'loading') {
			return <LoadingView text="Loading Course Data…" />
		}

		if (this.props.courseDataState === 'not-loaded') {
			let msg = PROMPT_TEXT + '\n\n' + NETWORK_WARNING

			return (
				<NoticeView
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
				<AnimatedSearchBar
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
