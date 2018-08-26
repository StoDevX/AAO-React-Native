// @flow

import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import * as c from '@frogpond/colors'
import {
	updateRecentSearches,
	updateRecentFilters,
} from '../../../redux/parts/courses'
import {LoadingView} from '@frogpond/notice'
import {type CourseType} from '../../../lib/course-search'
import type {ReduxState} from '../../../redux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import {CourseResultsList} from './list'
import {AnimatedSearchbox} from '../components/animated-searchbox'
import {applyFiltersToItem, type FilterType} from '../../../components/filter'
import {Separator} from '@frogpond/separator'
import {buildFilters} from './lib/build-filters'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>,
	isConnected: boolean,
	courseDataState: string,
}

type ReduxDispatchProps = {
	updateRecentFilters: (filters: FilterType[]) => any,
	updateRecentSearches: (query: string) => any,
}

type DefaultProps = {
	applyFilters: (filters: FilterType[], item: CourseType) => boolean,
}

type NavigationProps = {
	navigation: {
		state: {
			params: {
				initialQuery?: string,
				initialFilters?: Array<FilterType>,
			},
		},
	},
}

type Props = ReactProps &
	ReduxStateProps &
	ReduxDispatchProps &
	DefaultProps &
	NavigationProps

type State = {
	filters: Array<FilterType>,
	typedQuery: string,
	searchQuery: string,
	isSearchbarActive: boolean,
	filtersLoaded: boolean,
}

class CourseSearchResultsView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'Course Search',
	}

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
		this.setState(state => ({searchQuery: state.typedQuery}))
	}

	handleSearchCancel = () => {
		this.setState(state => ({
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
		} else if (this.state.filters.some(f => f.enabled)) {
			// if there is at least one active filter, add the filter set to the Recent Filters list
			this.props.updateRecentFilters(this.state.filters)
		}
	}

	updateFilter = (filter: FilterType) => {
		this.setState(state => {
			let edited = state.filters.map(f => (f.key !== filter.key ? f : filter))
			return {filters: edited}
		})
	}

	resetFilters = async () => {
		const newFilters = await buildFilters()
		this.setState(() => ({filters: newFilters, filtersLoaded: true}))
	}

	render() {
		let {
			typedQuery,
			searchQuery,
			filters,
			isSearchbarActive,
			filtersLoaded,
		} = this.state

		if (this.props.courseDataState !== 'ready') {
			return <LoadingView text="Loading Course Data…" />
		}

		return (
			<View style={[styles.container, styles.common]}>
				<AnimatedSearchbox
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

function mapState(state: ReduxState): ReduxStateProps {
	return {
		isConnected: state.app ? state.app.isConnected : false,
		allCourses: state.courses ? state.courses.allCourses : [],
		courseDataState: state.courses ? state.courses.readyState : '',
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		updateRecentSearches: (query: string) =>
			dispatch(updateRecentSearches(query)),
		updateRecentFilters: (filters: FilterType[]) =>
			dispatch(updateRecentFilters(filters)),
	}
}

export default connect(
	mapState,
	mapDispatch,
)(CourseSearchResultsView)

let styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	common: {
		backgroundColor: c.white,
	},
	darken: {},
})
