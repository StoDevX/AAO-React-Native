// @flow

import * as React from 'react'
import {StyleSheet, View, Animated, Platform} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {SearchBar} from '../../components/searchbar'
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
import fuzzysearch from 'fuzzysearch'
import {CourseSearchResultsList} from './list'
import LoadingView from '../../components/loading'
import {deptNum} from './lib/format-dept-num'
import {NoticeView} from '../../components/notice'
import {Viewport} from '../../components/viewport'
import {applyFiltersToItem, type FilterType} from '../../components/filter'
import {RecentItemsList} from '../components/recent-search/list'
import {Separator} from '../../components/separator'
import {buildFilters} from './lib/build-filters'
import type {FilterComboType} from './lib/format-filter-combo'

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
	browsing: boolean,
	cachedFilters: Array<FilterType>,
	dataLoading: boolean,
	searchResults: Array<{title: string, data: Array<CourseType>}>,
	searchActive: boolean,
	searchPerformed: boolean,
	query: string,
}

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
			fuzzysearch(query, course.name.toLowerCase()) ||
			fuzzysearch(query, (course.title || '').toLowerCase()) ||
			(course.instructors || []).some(name =>
				name.toLowerCase().includes(query),
			) ||
			deptNum(course)
				.toLowerCase()
				.startsWith(query) ||
			(course.gereqs || []).some(gereq =>
				gereq.toLowerCase().startsWith(query),
			),
	)

	const grouped = groupBy(results, r => r.term)
	const groupedCourses = toPairs(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	const sortedCourses = sortBy(groupedCourses, course => course.title).reverse()

	if (text.length !== 0) {
		updateRecentSearches(text)
	}

	return {
		searchResults: sortedCourses,
		searchPerformed: true,
		query: text,
	}
}

function executeBrowse(args: {
	filters: FilterType[],
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
	allCourses: Array<CourseType>,
}) {
	const {filters, applyFilters, allCourses} = args
	const filteredCourses = allCourses.filter(course =>
		applyFilters(filters, course),
	)
	const grouped = groupBy(filteredCourses, r => r.term)
	const groupedCourses = toPairs(grouped).map(([key, value]) => ({
		title: key,
		data: value,
	}))

	const sortedCourses = sortBy(groupedCourses, course => course.title).reverse()

	return {
		searchResults: sortedCourses,
	}
}

class CourseSearchView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
		title: 'SIS',
	}

	static defaultProps = {
		applyFilters: applyFiltersToItem,
	}

	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		if (prevState.browsing) {
			return executeBrowse({
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

	state = {
		browsing: false,
		cachedFilters: this.props.filters,
		dataLoading: true,
		searchResults: [],
		searchActive: false,
		searchPerformed: false,
		query: '',
	}

	componentDidMount() {
		areAnyTermsCached().then(anyTermsCached => {
			if (anyTermsCached) {
				this.loadData()
			} else {
				this.setState(() => ({dataLoading: false}))
			}
		})
		this.updateFilters(this.props)
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

	loadData = () => {
		this.setState(() => ({dataLoading: true}))

		if (this.props.courseDataState !== 'ready') {
			// If the data has not been loaded into Redux State:
			// 1. load the cached courses
			// 2. if any courses are cached, hide the spinner
			// 3. either way, start updating courses in the background
			// 4. when everything is done, make sure the spinner is hidden
			return this.props
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
			return this.props.updateCourseData().then(() => this.doneLoading())
		}
	}

	doneLoading = () => this.setState(() => ({dataLoading: false}))

	onSearchButtonPress = text => {
		if (Platform.OS === 'ios') {
			this.searchBar.blur()
		}

		this.performSearch(text)
	}

	_performSearch = (query: string) =>
		this.setState(() =>
			executeSearch({
				text: query,
				filters: this.props.filters,
				applyFilters: this.props.applyFilters,
				allCourses: this.props.allCourses,
				updateRecentSearches: this.props.updateRecentSearches,
			}),
		)

	performSearch = debounce(this._performSearch, 20)

	browseAll = () => {
		this.setState(() =>
			executeBrowse({
				filters: this.props.filters,
				applyFilters: this.props.applyFilters,
				allCourses: this.props.allCourses,
			}),
		)
	}

	onRecentSearchPress = (text: string) => {
		this.handleFocus()

		if (Platform.OS === 'android') {
			this.searchBar.setValue(text)
		}

		this.performSearch(text)
	}

	onRecentFilterPress = async (text: string) => {
		this.setState(() => ({browsing: true}))
		this.handleFocus()
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

	animate = (thing, args, toValue: 'start' | 'end') =>
		Animated.timing(thing, {
			toValue: args[toValue],
			duration: args.duration,
		}).start()

	handleFocus = () => {
		this.animate(this.headerOpacity, this.animations.headerOpacity, 'end')
		this.animate(this.searchBarTop, this.animations.searchBarTop, 'end')
		this.animate(this.containerHeight, this.animations.containerHeight, 'end')
		this.resetFilters()
		this.setState(() => ({searchActive: true}))
	}

	handleCancel = () => {
		this.animate(this.headerOpacity, this.animations.headerOpacity, 'start')
		this.animate(this.searchBarTop, this.animations.searchBarTop, 'start')
		this.animate(this.containerHeight, this.animations.containerHeight, 'start')
		if (Platform.OS === 'android') {
			this.searchBar.setValue('')
		}
		this.setState(() => ({searchActive: false, browsing: false, query: ''}))
	}

	openFilterView = () => {
		this.resetFilters()
		this.props.navigation.navigate('FilterView', {
			title: 'Add Filters',
			pathToFilters: ['courses', 'filters'],
			onChange: filters => this.props.onFiltersChange(filters),
			onLeave: filters => this.props.updateRecentFilters(filters),
		})
		this.setState(() => ({browsing: true}))
		this.handleFocus()
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
			searchActive,
			searchPerformed,
			searchResults,
			query,
			browsing,
		} = this.state

		if (this.state.dataLoading) {
			return <LoadingView text="Loading Course Data…" />
		}

		if (this.props.courseDataState == 'not-loaded') {
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

		const placeholderPrompt = browsing
			? 'Browsing all courses'
			: 'Search Class & Lab'

		const recentFilterDescriptions = this.props.recentFilters.map(
			f => f.description,
		)

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
						<View style={[styles.container, styles.common]}>
							<Animated.View style={aniContainerStyle}>
								<Animated.Text style={aniHeaderStyle}>
									Search Courses
								</Animated.Text>
								<Animated.View style={aniSearchStyle}>
									<SearchBar
										getRef={ref => (this.searchBar = ref)}
										onCancel={this.handleCancel}
										onFocus={this.handleFocus}
										onSearchButtonPress={this.onSearchButtonPress}
										placeholder={placeholderPrompt}
										searchActive={searchActive}
										text={query}
										textFieldBackgroundColor={c.sto.lightGray}
									/>
								</Animated.View>
							</Animated.View>
							<Separator />
							{searchActive ? (
								<CourseSearchResultsList
									browsing={browsing}
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
				}}
			/>
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

export default connect(mapState, mapDispatch)(CourseSearchView)

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
