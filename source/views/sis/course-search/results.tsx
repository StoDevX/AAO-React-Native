import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import * as c from '@frogpond/colors'
import {
	updateRecentSearches,
	updateRecentFilters,
} from '../../../redux/parts/courses'
import {LoadingView} from '@frogpond/notice'
import type {CourseType} from '../../../lib/course-search'
import type {ReduxState} from '../../../redux'
import type {TopLevelViewPropsType} from '../../types'
import {useSelector, useDispatch} from 'react-redux'
import {CourseResultsList} from './list'
import {AnimatedSearchBar} from '@frogpond/searchbar'
import {applyFiltersToItem} from '@frogpond/filter'
import type FilterType from '@frogpond/filter'
import {Separator} from '@frogpond/separator'
import {buildFilters} from './lib/build-filters'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>
	courseDataState: string
}

type ReduxDispatchProps = {
	updateRecentFilters: (filters: FilterType[]) => any
	updateRecentSearches: (query: string) => any
}

type DefaultProps = {
	applyFilters: (filters: FilterType[], item: CourseType) => boolean
}

type NavigationProps = {
	navigation: {
		state: {
			params: {
				initialQuery?: string
				initialFilters?: Array<FilterType>
			}
		}
	}
}

type Props = ReactProps &
	ReduxStateProps &
	ReduxDispatchProps &
	DefaultProps &
	NavigationProps

type State = {
	filters: Array<FilterType>
	typedQuery: string
	searchQuery: string
	isSearchbarActive: boolean
	filtersLoaded: boolean
}

class CourseSearchResultsView extends React.Component<Props, State> {
	static defaultProps = {
		applyFilters: applyFiltersToItem,
	}

	state = {
		isSearchbarActive: false,
		filtersLoaded: Boolean(this.props.navigation.state.params.initialFilters),
		filters: this.props.navigation.state.params.initialFilters || [],
		typedQuery: this.props.navigation.state.params.initialQuery || '',
		searchQuery: this.props.navigation.state.params.initialQuery || '',
	}

	componentDidMount() {
		if (!this.state.filters.length) {
			this.resetFilters()
		}
	}

	handleSearchSubmit = () => {
		this.setState((state) => ({searchQuery: state.typedQuery}))
	}

	handleSearchCancel = () => {
		this.setState((state) => ({
			typedQuery: state.searchQuery,
			isSearchbarActive: false,
		}))
	}

	handleSearchChange = (value: string) => {
		this.setState(() => ({typedQuery: value}))

		if (value === '') {
			this.setState(() => ({searchQuery: value}))
		}
	}

	handleSearchFocus = () => {
		this.setState(() => ({isSearchbarActive: true}))
	}

	onRecentSearchPress = (text: string) => {
		this.setState(() => ({
			typedQuery: text,
			searchQuery: text,
		}))
	}

	handleListItemPress = () => {
		if (this.state.searchQuery.length) {
			// if there is text in the search bar, add the text to the Recent Searches list
			this.props.updateRecentSearches(this.state.searchQuery)
		} else if (this.state.filters.some((f) => f.enabled)) {
			// if there is at least one active filter, add the filter set to the Recent Filters list
			this.props.updateRecentFilters(this.state.filters)
		}
	}

	updateFilter = (filter: FilterType) => {
		this.setState((state) => {
			let edited = state.filters.map((f) => (f.key !== filter.key ? f : filter))
			return {filters: edited}
		})
	}

	resetFilters = async () => {
		let newFilters = await buildFilters()
		this.setState(() => ({filters: newFilters, filtersLoaded: true}))
	}

	render() {
		let {typedQuery, searchQuery, filters, isSearchbarActive, filtersLoaded} =
			this.state

		if (this.props.courseDataState !== 'ready') {
			return <LoadingView text="Loading Course Data…" />
		}

		return (
			<View style={[styles.container, styles.common]}>
				<AnimatedSearchBar
					active={true}
					onCancel={this.handleSearchCancel}
					onChange={this.handleSearchChange}
					onFocus={this.handleSearchFocus}
					onSubmit={this.handleSearchSubmit}
					placeholder="Search Class & Lab"
					value={typedQuery}
				/>

				<Separator />

				<CourseResultsList
					key={searchQuery.toLowerCase()}
					applyFilters={this.props.applyFilters}
					contentContainerStyle={styles.contentContainer}
					courses={this.props.allCourses}
					filters={filters}
					filtersLoaded={filtersLoaded}
					navigation={this.props.navigation}
					onListItemPress={this.handleListItemPress}
					onPopoverDismiss={this.updateFilter}
					query={searchQuery}
					style={isSearchbarActive ? styles.darken : null}
				/>
			</View>
		)
	}
}

export function ConnectedCourseSearchResultsView(props: TopLevelViewPropsType) {
	let dispatch = useDispatch()

	let allCourses = useSelector(
		(state: ReduxState) => state.courses?.allCourses || [],
	)
	let courseDataState = useSelector(
		(state: ReduxState) => state.courses?.readyState || '',
	)

	let updateSearches = React.useCallback(
		(query: string) => dispatch(updateRecentSearches(query)),
		[dispatch],
	)
	let updateFilters = React.useCallback(
		(filters: FilterType[]) => dispatch(updateRecentFilters(filters)),
		[dispatch],
	)

	return (
		<CourseSearchResultsView
			{...props}
			allCourses={allCourses}
			courseDataState={courseDataState}
			updateRecentFilters={updateFilters}
			updateRecentSearches={updateSearches}
		/>
	)
}
ConnectedCourseSearchResultsView.navigationOptions = {
	title: 'Course Search',
}

let styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	common: {
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
	darken: {},
})
