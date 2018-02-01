// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, View, Animated, Dimensions, Text} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as c from '../../components/colors'
import {CourseSearchBar} from '../components/searchbar'
import debounce from 'lodash/debounce'
import {updateCourseData} from '../../../flux/parts/sis'
import {CourseType} from '../../../lib/course-search'
import type {ReduxState} from '../../../flux'
import type {TopLevelViewPropsType} from '../../types'
import {connect} from 'react-redux'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import toPairs from 'lodash/toPairs'
import CourseSearchTableView from '../components/results'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	allCourses: Array<CourseType>,
	courseDataState: string,
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
	static navigationOptions = {
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
		title: 'SIS',
	}

	state = {
		searchResults: [],
    searchActive: false,
	}

	componentWillMount() {
		this.headerOpacity = new Animated.Value(1)
		this.searchBarTop = new Animated.Value(71)
		this.containerHeight = new Animated.Value(125)
	}

	componentDidMount() {
		this.props.updateCourseData()
	}

	searchBar: any = null

	_performSearch = (text: string | Object) => {
		// Android clear button returns an object
		// if (typeof text !== 'string') {
		// 	return this.props.onSearch(null)
		// }
		const query = text.toLowerCase()

		let results = this.props.allCourses.filter(course => {
			const instructors = course.instructors
				? course.instructors.toString().toLowerCase()
				: []
			return (
				course.name.toLowerCase().includes(query) || instructors.includes(query)
			)
		})

		let grouped = groupBy(results, r => r.term)
		let groupedCourses = toPairs(grouped).map(([key, value]) => ({
			title: key,
			data: value,
		}))
		let sortedCourses = sortBy(groupedCourses, course => course.title).reverse()
		this.setState({searchResults: sortedCourses})
		console.log(sortedCourses)
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
    this.setState({searchActive: true})
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
    const SEARCH_PROMPT = "Name\nProfessor"

		return (
			<View style={{flex: 1}}>
				<Animated.View
					style={[styles.searchContainer, styles.common, containerAnimation]}
				>
					<Animated.Text
						ref={component => (this._header = component)}
						style={[styles.header, headerAnimation]}
					>
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
								this.searchBar.unFocus()
								this.performSearch(text)
							}}
							style={styles.searchBar}
						/>
					</Animated.View>
				</Animated.View>
          {searchActive ? (
            <ScrollView>
              <CourseSearchTableView
    						navigation={this.props.navigation}
    						terms={this.state.searchResults}
    					/>
            </ScrollView>
          ): (
            <View>
            </View>
          )}
			</View>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		allCourses: state.sis ? state.sis.allCourses : null,
		courseDataState: state.sis ? state.sis.courseDataState : null,
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		updateCourseData: () => dispatch(updateCourseData()),
	}
}

export default connect(mapState, mapDispatch)(CourseSearchView)

let styles = StyleSheet.create({
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
