// @flow
/**
 * All About Olaf
 * Courses page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  Platform,
  ListView,
  RefreshControl,
} from 'react-native'

import {isLoggedIn} from '../../lib/login'
import delay from 'delay'
import zip from 'lodash/zip'
import isError from 'lodash/isError'
import _isNaN from 'lodash/isNaN'
import isNil from 'lodash/isNil'
import {ListSeparator, ListRow, ListSectionHeader} from '../components/list'
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
    if (course.message) {
      // curses be to flow
      let innerCourse = ((course: any): {message: string})
      return (
        <ListRow style={styles.rowContainer}>
          <Column>
            <Title>Error</Title>
            <Detail lines={2}>{innerCourse.message || 'The course had an error'}</Detail>
          </Column>
        </ListRow>
      )
    }

    course = ((course: any): CourseType)

    let locationTimePairs = zip(course.locations, course.times)
    let deptnum = `${course.department.join('/')} ${_isNaN(course.number) || isNil(course.number) ? '' : course.number}` + (course.section || '')
    return (
      <ListRow style={styles.rowContainer}>
        <Column>
          <Title>{course.name}</Title>
          <Detail>
            <Text key='desc'>{deptnum}</Text>
            {locationTimePairs.map(([place, time], i) =>
              <Text key={i}>{place}: {time}</Text>)}
          </Detail>
        </Column>
      </ListRow>
    )
  }

  renderSectionHeader = (courses: Object, term: number) => {
    return <ListSectionHeader style={styles.rowSectionHeader} title={toPrettyTerm(term)} />
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} style={styles.separator} />
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
})
