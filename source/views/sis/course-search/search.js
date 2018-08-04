// @flow

import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {
	updateCourseData,
	loadCourseDataIntoMemory,
	updateCourseFilters,
	updateRecentSearches,
	updateRecentFilters,
} from '../../../flux/parts/courses'
import {type CourseType, areAnyTermsCached} from '../../../lib/course-search'
import type {ReduxState} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import debounce from 'lodash/debounce'
import {CourseSearchResultsList} from './list'
import LoadingView from '../../components/loading'
import {deptNum} from './lib/format-dept-num'
import {NoticeView} from '../../components/notice'
import {AnimatedSearchbox} from '../components/animated-searchbox'
import {applyFiltersToItem, type FilterType} from '../../components/filter'
import {RecentItemsList} from '../components/recents-list'
import {Separator} from '../../components/separator'
import {buildFilters} from './lib/build-filters'
import type {FilterComboType} from './lib/format-filter-combo'
import keywordSearch from 'keyword-search'

const PROMPT_TEXT =
	'We need to download the courses from the server. This will take a few seconds.'
const NETWORK_WARNING =
	"You'll need an internet connection to download the courses."

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>,
	courseDataState: string,
	filters: Array<FilterType>,
	isConnected: boolean,
	recentFilters: FilterComboType[],
	recentSearches: string[],
}

type ReduxDispatchProps = {
	updateCourseData: () => Promise<any>,
	loadCourseDataIntoMemory: () => Promise<any>,
	onFiltersChange: (filters: FilterType[]) => any,
	updateRecentFilters: (filters: FilterType[]) => any,
	updateRecentSearches: (query: string) => any,
}

type DefaultProps = {
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps & DefaultProps

type State = {
	cachedFilters: Array<FilterType>,
	searchResults: Array<{title: string, data: Array<CourseType>}>,
	searchPerformed: boolean,
	query: string,
	mode: 'loading' | 'browsing' | 'searching' | 'ready',
};

function executeSearch(args: {
	text: string,
	filters: FilterType[],
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
	allCourses: Array<CourseType>,
	updateRecentSearches: (query: string) => any,
}) {
	const {text, filters, applyFilters, allCourses, updateRecentSearches} = args
	const query = text.toLowerCase()

	const filteredCourses = allCourses.filter(course =>
		applyFilters(filters, course),
	)

	const results = filteredCourses.filter(
		course =>
			keywordSearch(query, course.name.toLowerCase(), 1) ||
			keywordSearch(query, (course.title || '').toLowerCase(), 1) ||
			(course.instructors || []).some(name =>
				keywordSearch(query, name.toLowerCase(), 1),
			) ||
			deptNum(course)
				.toLowerCase()
				.startsWith(query) ||
			(course.gereqs || []).some(gereq =>
				gereq.toLowerCase().startsWith(query),
			),
	)
	const sortedResults = sortBy(results, course => deptNum(course))
	const grouped = groupBy(sortedResults, r => r.term)
	const groupedCourses = toPairs(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	const sortedTerms = sortBy(groupedCourses, course => course.title).reverse()

	if (text.length !== 0) {
		updateRecentSearches(text)
	}

	return {
		searchResults: sortedTerms,
		searchPerformed: true,
		query: text,
	}
}

function applyFiltersAndQuery(args: {
	filters: FilterType[],
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
	allCourses: Array<CourseType>,
}) {
	const {filters, applyFilters, allCourses} = args
	const filteredCourses = allCourses.filter(course =>
		applyFilters(filters, course),
	)
	const sortedCourses = sortBy(filteredCourses, course => deptNum(course))
	const grouped = groupBy(sortedCourses, r => r.term)
	const groupedCourses = toPairs(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	const sortedTerms = sortBy(groupedCourses, course => course.title).reverse()

	return {
		searchResults: sortedTerms,
	}
}

class CourseSearchView extends React.Component<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
		title: 'SIS',
	}

	static defaultProps = {
		applyFilters: applyFiltersToItem,
	}

	state = {
		mode: 'loading',
		cachedFilters: this.props.filters,
		searchResults: [],
		searchPerformed: false,
		query: '',
	}

	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		if (prevState.browsing) {
			return applyFiltersAndQuery({
				filters: nextProps.filters,
				applyFilters: nextProps.applyFilters,
				allCourses: nextProps.allCourses,
			})
		}

		if (!prevState.query) {
			return null
		}

		if (nextProps.filters === prevState.cachedFilters) {
			return null
		}

		return executeSearch({
			text: prevState.query,
			filters: nextProps.filters,
			applyFilters: nextProps.applyFilters,
			allCourses: nextProps.allCourses,
			updateRecentSearches: nextProps.updateRecentSearches,
		})
	}

	componentDidMount() {
		this.loadData()
		this.updateFilters(this.props)
	}

	loadData = async () => {
		this.setState(() => ({mode: 'loading'}))

		// If the data has not been loaded into Redux State:
		if (this.props.courseDataState !== 'ready') {
			// 1. load the cached courses
			await this.props.loadCourseDataIntoMemory()

			// 2. if any courses are cached, hide the spinner
			if (await areAnyTermsCached()) {
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
		this.setState(() => ({mode: 'searching'}))
		this.performSearch(this.state.query)
	}

	handleSearchCancel = () => {
		this.setState(() => ({
			query: '',
			searchResults: [],
			searchPerformed: false,
			mode: 'ready',
		}))
		this.resetFilters()
	}

	handleSearchChange = (value: string) => {
		this.setState(() => ({query: value}))
	}

	handleSearchFocus = () => {
		this.setState(() => ({mode: 'searching'}))
	}

	_performSearch = (query: string) => {
		const results = executeSearch({
			text: query,
			filters: this.props.filters,
			applyFilters: this.props.applyFilters,
			allCourses: this.props.allCourses,
			updateRecentSearches: this.props.updateRecentSearches,
		})

		this.setState(() => results)
	}

	performSearch = debounce(this._performSearch, 20)

	browseAll = () => {
		this.setState(() =>
			applyFiltersAndQuery({
				filters: this.props.filters,
				applyFilters: this.props.applyFilters,
				allCourses: this.props.allCourses,
			}),
		)
	}

	onRecentSearchPress = (text: string) => {
		this.setState(() => ({query: text, mode: 'searching'}))

		this.performSearch(text)
	}

	onRecentFilterPress = async (text: string) => {
		this.setState(() => ({mode: 'browsing'}))

		const selectedFilterCombo = this.props.recentFilters.find(
			f => f.description === text,
		)
		const resetFilters = await buildFilters()
		const selectedFilters = selectedFilterCombo
			? resetFilters.map(
					f => selectedFilterCombo.filters.find(f2 => f2.key === f.key) || f,
			  )
			: resetFilters

		this.props.onFiltersChange(selectedFilters)

		this.browseAll()
	}

	openFilterView = () => {
		this.props.navigation.navigate('FilterView', {
			title: 'Add Filters',
			pathToFilters: ['courses', 'filters'],
			onChange: filters => this.props.onFiltersChange(filters),
			onLeave: filters => this.props.updateRecentFilters(filters),
		})

		this.setState(() => ({mode: 'browsing'}))
	}

	resetFilters = async () => {
		const newFilters = await buildFilters()
		this.props.onFiltersChange(newFilters)
	}

	updateFilters = (props: Props) => {
		const {filters} = props

		// prevent ourselves from overwriting the filters from redux on mount
		if (filters.length) {
			return
		}

		this.resetFilters()
	}

	render() {
		const {
			searchPerformed,
			searchResults,
			query,
			mode,
		} = this.state

		if (mode === 'loading') {
			return <LoadingView text="Loading Course Data…" />
		}

		if (this.props.courseDataState === 'not-loaded') {
			const msg = this.props.isConnected
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

		const placeholderPrompt = mode === 'browsing'
			? 'Browsing all courses'
			: 'Search Class & Lab'

		const recentFilterDescriptions = this.props.recentFilters.map(
			f => f.description,
		)

		return (
			<View style={[styles.container, styles.common]}>
				<AnimatedSearchbox
					active={mode !== 'ready'}
					onCancel={this.handleSearchCancel}
					onChange={this.handleSearchChange}
					onFocus={this.handleSearchFocus}
					onSubmit={this.handleSearchSubmit}
					placeholder={placeholderPrompt}
					title="Search Courses"
					value={query}
				/>
				<Separator />
				{mode !== 'ready' ? (
					<CourseSearchResultsList
						browsing={mode === 'browsing'}
						filters={this.props.filters}
						navigation={this.props.navigation}
						onFiltersChange={this.props.onFiltersChange}
						searchPerformed={searchPerformed}
						terms={searchResults}
						updateRecentFilters={this.props.updateRecentFilters}
					/>
				) : (
					<View style={[styles.common, styles.bottomContainer]}>
						<RecentItemsList
							emptyHeader="No recent searches"
							emptyText="Your recent searches will appear here."
							items={this.props.recentSearches}
							onItemPress={this.onRecentSearchPress}
							title="Recent"
						/>
						<RecentItemsList
							actionLabel="Select Filters"
							emptyHeader="No recent filter combinations"
							emptyText="Your recent filter combinations will appear here."
							items={recentFilterDescriptions}
							onAction={this.openFilterView}
							onItemPress={this.onRecentFilterPress}
							title="Browse"
						/>
					</View>
				)}
			</View>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		isConnected: state.app ? state.app.isConnected : false,
		allCourses: state.courses ? state.courses.allCourses : [],
		courseDataState: state.courses ? state.courses.readyState : '',
		filters: state.courses ? state.courses.filters : [],
		recentFilters: state.courses ? state.courses.recentFilters : [],
		recentSearches: state.courses ? state.courses.recentSearches : [],
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		loadCourseDataIntoMemory: () => dispatch(loadCourseDataIntoMemory()),
		onFiltersChange: (filters: FilterType[]) =>
			dispatch(updateCourseFilters(filters)),
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
