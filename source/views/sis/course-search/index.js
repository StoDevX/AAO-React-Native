// @flow

import * as React from 'react'
import {
  StyleSheet,
  ScrollView,
  Picker,
  View,
  Text,
  ListView,
  Animated,
  Dimensions
} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import {Cell, TableView, Section} from 'react-native-tableview-simple'
import * as c from '../../components/colors'
import {Select, Option} from 'react-native-chooser'
import {CourseSearchBar} from '../components/searchbar'
import debounce from 'lodash/debounce'
import {ToolBar} from 'react-native-material-ui'
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

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps & {
  navigation: {state: {params: {}}},
}

type State = {
  searchResults: Array<{title: string, data: Array<CourseType>}>,
}


class CourseSearchView extends React.PureComponent<Props, State> {
  static navigationOptions = ({navigation}: any) => ({
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
    title: "SIS",
	})

  state = {
    searchResults: [],
  }

  searchBar: any = null

  _performSearch = (text: string | Object) => {
		// Android clear button returns an object
		// if (typeof text !== 'string') {
		// 	return this.props.onSearch(null)
		// }
    const query = text.toLowerCase()

    let results = this.props.allCourses.filter(course => {
      const instructors = course.instructors ? course.instructors.toString().toLowerCase() : []
      return (
        course.name.toLowerCase().includes(query) ||
        instructors.includes(query) 
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

  componentWillMount() {
    let screenWidth = Dimensions.get('window').width
    this.headerOpacity = new Animated.Value(1)
    this.searchBarTop = new Animated.Value(71)
    this.containerHeight = new Animated.Value(125)
  }

  componentDidMount() {
    this.props.updateCourseData()
  }

	// We need to make the search run slightly behind the UI,
	// so I'm slowing it down by 50ms. 0ms also works, but seems
	// rather pointless.
	performSearch = debounce(this._performSearch, 50)

  onFocus = () => {
    let screenWidth = Dimensions.get('window').width
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
  }

  onCancel = () => {
    let screenWidth = Dimensions.get('window').width
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
    const headerAnimation = { opacity: this.headerOpacity }
    const searchBarAnimation = {
      top: this.searchBarTop,
    }
    const containerAnimation = { height: this.containerHeight }

    return (

        <View>


          <Animated.View style={[styles.searchContainer, styles.common, containerAnimation]}>
            <Animated.Text
              style={[styles.header, headerAnimation]}
              ref={component => this._header = component}
            >
              Search Courses
            </Animated.Text>
            <Animated.View style={[styles.searchBarWrapper, {width: searchBarWidth}, searchBarAnimation]}>
              <CourseSearchBar
                getRef={ref => (this.searchBar = ref)}
                onFocus={this.onFocus}
                onCancel={this.onCancel}
                onSearchButtonPress={(text) => {
                  this.searchBar.unFocus()
                  this.performSearch(text)
                }}
                style={styles.searchBar}
              >
              </CourseSearchBar>
            </Animated.View>

          </Animated.View>
          <ScrollView>
            <CourseSearchTableView
              terms={this.state.searchResults}
              navigation={this.props.navigation}
            />
          </ScrollView>


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

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10


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

  picker: {
    height: 90,
  },

  rectangle: {
		flex: 1,
    height: 88,
		alignItems: 'center',
		marginBottom: cellMargin,
	},

})

// <Section header="Year/Term">
//   <View>
//     <Picker
//       selectedValue = "20173"
//       onValueChange={(value) => console.log(value)}
//       style={[styles.common, styles.picker]}
//       itemStyle={styles.picker}
//     >
//       <Picker.Item label="Interim 2017" value="20172"/>
//       <Picker.Item label="Spring 2017" value="20173"/>
//     </Picker>
//   </View>
// </Section>
