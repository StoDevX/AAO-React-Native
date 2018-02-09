// @flow

import * as React from 'react'
import {StyleSheet, View, Animated, Dimensions, Platform, Text} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {CourseSearchBar} from '../components/searchbar'
import debounce from 'lodash/debounce'
import {updateCourseData} from '../../../flux/parts/sis'
import type {CourseType} from '../../../lib/course-search'
import type {ReduxState} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import {CourseSearchResultsList} from './list'
import LoadingView from '../../components/loading'
import {Cell} from 'react-native-tableview-simple'
import type {FilterType} from './filters/types'
import {MenuButton} from '../components/menu-icon'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>,
	courseDataState: string,
	filters: Array<FilterType>,
}

type ReduxDispatchProps = {
	updateCourseData: () => any,
}

type Props = ReactProps &
	ReduxStateProps &
	ReduxDispatchProps & {
		navigation: {state: {params: {}}},
	}

type State = {
	searchResults: Array<{title: string, data: Array<CourseType>}>,
	searchActive: boolean,
}

class CourseSearchView extends React.PureComponent<Props, State> {
	static navigationOptions = ({navigation}: any) => {
		const menuButton = <MenuButton onPress={() => {navigation.navigate('CourseSearchFiltersView')}} />
		return {
			tabBarLabel: 'Course Search',
			tabBarIcon: TabBarIcon('search'),
			title: 'SIS',
			headerRight: menuButton,
		}
	}

	state = {
		searchResults: [],
		searchActive: false,
	}

	componentDidMount() {
		this.props.updateCourseData()
	}

	searchBar: any = null
	headerOpacity = new Animated.Value(1)
	searchBarTop = new Animated.Value(71)
	containerHeight = new Animated.Value(125)

	_performSearch = (text: string | Object) => {
		const query = text.toLowerCase()
		let results = this.props.allCourses.filter(course => {
			const section = course.section ? course.section.toLowerCase() : ''
			return (
				course.name.toLowerCase().includes(query) ||
				(course.instructors || []).some(name =>
					name.toLowerCase().includes(query),
				) ||
				`${course.departments
					.join('/')
					.toLowerCase()} ${course.number.toString()}${section}`.startsWith(
					query,
				)
			)
		})
		const filters = this.props.filters
		if (filters.length !== 0) {
			filters.forEach(filter => {
				if (filter.filterCategory === 'GEs') {
					results = results.filter(course => {
						const gereqs = course.gereqs || []
						return gereqs.includes(filter.value)
					})
				}
			})
		}

		let grouped = groupBy(results, r => r.term)
		let groupedCourses = toPairs(grouped).map(([key, value]) => ({
			title: key,
			data: value,
		}))
		let sortedCourses = sortBy(groupedCourses, course => course.title).reverse()
		this.setState({searchResults: sortedCourses})
	}

	// We need to make the search run slightly behind the UI,
	// so I'm slowing it down by 50ms. 0ms also works, but seems
	// rather pointless.
	performSearch = debounce(this._performSearch, 50)

	onFocus = () => {
		Animated.timing(this.headerOpacity, {
			toValue: 0,
			duration: 800,
		}).start()
		Animated.timing(this.searchBarTop, {
			toValue: 10,
			duration: 800,
		}).start()
		Animated.timing(this.containerHeight, {
			toValue: 64,
			duration: 800,
		}).start()
		this.setState(() => ({searchActive: true}))
	}

	onCancel = () => {
		Animated.timing(this.headerOpacity, {
			toValue: 1,
			duration: 800,
		}).start()
		Animated.timing(this.searchBarTop, {
			toValue: 71,
			duration: 800,
		}).start()
		Animated.timing(this.containerHeight, {
			toValue: 125,
			duration: 800,
		}).start()
		this.setState(() => ({searchActive: false}))
	}

	openFilters = () => {
		this.props.navigation.navigate('CourseSearchFiltersView', {})
	}

	render() {
		const screenWidth = Dimensions.get('window').width
		const searchBarWidth = screenWidth - 20
		const headerAnimation = {opacity: this.headerOpacity}
		const searchBarAnimation = {
			top: this.searchBarTop,
		}
		const containerAnimation = {height: this.containerHeight}
		const {searchActive} = this.state
		const loadingCourseData = this.props.courseDataState === 'updating'
		if (loadingCourseData) {
			return <LoadingView text="Loading Course Data..." />
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
						<CourseSearchBar
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
						/>
					</Animated.View>
				</Animated.View>
				{searchActive ? (
					<View>
						<Cell
							accessory="DisclosureIndicator"
							backgroundColor={c.sto.lightGray}
							cellStyle="Basic"
							onPress={this.openFilters}
							title="Add Filters..."
						/>
						<CourseSearchResultsList
							navigation={this.props.navigation}
							terms={this.state.searchResults}
						/>
					</View>
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
		filters: state.sis ? state.sis.filters : [],
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
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

	filtersContainer: {
		backgroundColor: c.white,
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderColor: c.iosDisabledText,
		borderTopWidth: 0.3,
	},

	filtersTitle: {
		color: c.infoBlue,
		fontSize: 16,
	},
})
