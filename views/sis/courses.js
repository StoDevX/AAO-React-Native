// @flow
/**
 * All About Olaf
 * Courses page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Platform,
  ListView,
  RefreshControl,
} from 'react-native'
import * as c from '../components/colors'

import {isLoggedIn} from '../../lib/login'
import delay from 'delay'
import zip from 'lodash/zip'
import isError from 'lodash/isError'
import _isNaN from 'lodash/isNaN'
import isNil from 'lodash/isNil'
import {Separator} from '../components/separator'
import LoadingScreen from '../components/loading'
import type {CourseType} from '../../lib/courses'
import {loadAllCourses} from '../../lib/courses'
import ErrorView from './error-screen'

const SEMESTERS = {
  '0': 'Abroad',
  '1': 'Fall',
  '2': 'Interim',
  '3': 'Spring',
  '4': 'Summer Session 1',
  '5': 'Summer Session 2',
  '9': 'Non-St. Olaf',
}

function semesterName(semester: number|string): string {
  if (typeof semester === 'number') {
    semester = String(semester)
  }
  return SEMESTERS.hasOwnProperty(semester)
        ? SEMESTERS[semester]
        : `Unknown (${semester})`
}

function toPrettyTerm(term: number): string {
  let str = String(term)
  let semester = semesterName(str[4])
  return `${semester} ${str.substr(0, 4)}`
}

export default class CoursesView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object,
    route: React.PropTypes.object,
  };

  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this.rowHasChanged,
      sectionHeaderHasChanged: this.sectionHeaderHasChanged,
    }),
    refreshing: false,
    loading: true,
    error: null,
    loggedIn: true,
  }

  componentWillMount() {
    this.loadIfLoggedIn()
  }

  loadIfLoggedIn = async () => {
    let shouldContinue = await this.checkLogin()
    if (shouldContinue) {
      await this.fetchData()
    }
  }

  rowHasChanged(r1: CourseType|Error, r2: CourseType|Error) {
    if (r1 instanceof Error && r2 instanceof Error) {
      return r1.message !== r2.message
    } else if (r1 instanceof Error || r2 instanceof Error) {
      return true
    }
    return r1.clbid !== r2.clbid
  }

  sectionHeaderHasChanged(h1: number, h2: number) {
    return h1 !== h2
  }

  checkLogin = async () => {
    let loggedIn = await isLoggedIn()
    this.setState({loggedIn})
    return loggedIn
  }

  fetchData = async (forceFromServer: boolean=false) => {
    try {
      let courses = await loadAllCourses(forceFromServer)
      if (isError(courses)) {
        this.setState({loggedIn: false})
      }
      this.setState({dataSource: this.state.dataSource.cloneWithRowsAndSections(courses)})
    } catch (error) {
      this.setState({error})
      console.warn(error)
    }
    this.setState({loading: false})
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({refreshing: true})
    await this.fetchData(true)

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState({refreshing: false})
  }

  renderRow = (course: CourseType|Error) => {
    if (isError(course) || course.line && course.column && course.sourceURL) {
      return (
        <View style={styles.rowContainer}>
          <Text style={styles.itemTitle}>Error</Text>
          <Text style={styles.itemPreview} numberOfLines={2}>{course.message || 'The course had an error'}</Text>
        </View>
      )
    }

    course = ((course: any): CourseType)

    let locationTimePairs = zip(course.locations, course.times)
    let deptnum = `${course.department.join('/')} ${_isNaN(course.number) || isNil(course.number) ? '' : course.number}` + (course.section || '')
    return (
      <View style={styles.rowContainer}>
        <Text style={styles.itemTitle} numberOfLines={1}>{course.name}</Text>
        <Text style={styles.itemPreview} numberOfLines={2}>{deptnum}</Text>
        {locationTimePairs.map(([place, time], i) =>
          <Text key={i} style={styles.itemPreview} numberOfLines={1}>{place}: {time}</Text>)}
      </View>
    )
  }

  renderSectionHeader = (courses: Object, term: number) => {
    return (
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText} numberOfLines={1}>
          {toPrettyTerm(term)}
        </Text>
      </View>
    )
  }

  renderSeparator = (sectionID: any, rowID: any) => {
    return <Separator key={`${sectionID}-${rowID}`} style={styles.separator} />
  }

  render() {
    if (this.state.error) {
      return <Text>Error: {this.state.error.message}</Text>
    }

    if (!this.state.loggedIn) {
      return <ErrorView
        route={this.props.route}
        navigator={this.props.navigator}
        onLoginComplete={() => this.loadIfLoggedIn()}
      />
    }

    if (this.state.loading) {
      return <LoadingScreen />
    }

    return (
      <ListView
        style={styles.listContainer}
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        enableEmptySections={true}
        pageSize={5}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      />
    )
  }
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
  separator: {
    marginLeft: 20,
  },
  rowContainer: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 8,
  },
  itemTitle: {
    color: c.black,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    fontSize: 13,
    textAlign: 'left',
  },
  rowSectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 20,
    borderTopWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
})
