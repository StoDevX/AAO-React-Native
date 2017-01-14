// @flow
/**
 * All About Olaf
 * Courses page
 */

import React from 'react'
import {
  StyleSheet,
  Platform,
  ListView,
  RefreshControl,
} from 'react-native'
import {tracker} from '../../analytics'
import {isLoggedIn} from '../../lib/login'
import delay from 'delay'
import zip from 'lodash/zip'
import isError from 'lodash/isError'
import _isNaN from 'lodash/isNaN'
import isNil from 'lodash/isNil'
import {Column} from '../components/layout'
import {ListRow, ListSeparator, ListSectionHeader, Detail, Title} from '../components/list'
import LoadingScreen from '../components/loading'
import {NoticeView} from '../components/notice'
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
      rowHasChanged: (r1: any, r2: any) => r1 !== r2,
      sectionHeaderHasChanged: (h1: any, h2: any) => h1 !== h2,
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
      tracker.trackException(error.message)
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
          <Detail>{deptnum}</Detail>
          {locationTimePairs.map(([place, time], i) =>
            <Detail key={i}>{place}: {time}</Detail>)}
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
      return <NoticeView text={'Error: ' + this.state.error.message} />
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
