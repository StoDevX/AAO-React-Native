/**
 * @flow
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
import {connect} from 'react-redux'
import delay from 'delay'
import zip from 'lodash/zip'
import _isNaN from 'lodash/isNaN'
import isNil from 'lodash/isNil'
import {Column} from '../components/layout'
import {ListRow, ListSeparator, ListSectionHeader, Detail, Title} from '../components/list'
import LoadingScreen from '../components/loading'
import {NoticeView} from '../components/notice'
import type {CourseType} from '../../lib/courses'
import ErrorView from './error-screen'
import type {TopLevelViewPropsType} from '../types'
import {updateCourses} from '../../flux/parts/sis'

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

type CoursesViewPropsType = TopLevelViewPropsType & {
  error: null,
  loggedIn: true,
  updateCourses: (force: boolean) => Promise<(CourseType|Error)[]>,
  courses: (CourseType|Error)[],
};

class CoursesView extends React.Component {
  state: {
    loading: boolean,
    dataSource: ListView.DataSource,
  } = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1: any, r2: any) => r1 !== r2,
      sectionHeaderHasChanged: (h1: any, h2: any) => h1 !== h2,
    }),
    loading: false,
  }

  componentWillReceiveProps(nextProps: CoursesViewPropsType) {
    this.updateListview(nextProps.courses)
  }

  props: CoursesViewPropsType;

  updateListview(courses) {
    this.setState({dataSource: this.state.dataSource.cloneWithRowsAndSections(courses)})
  }

  fetchData = async () => {
    let courses = await this.props.updateCourses(true)
    this.updateListview(courses)
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({loading: true})

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    await delay(500 - elapsed)

    this.setState({loading: false})
  }

  renderRow = (course: CourseType) => {
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
    if (this.props.error) {
      return <NoticeView text={'Error: ' + this.props.error.message} />
    }

    if (!this.props.loggedIn) {
      return <ErrorView
        route={this.props.route}
        navigator={this.props.navigator}
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
            refreshing={this.state.loading}
            onRefresh={this.refresh}
          />
        }
      />
    )
  }
}

function mapStateToProps(state) {
  return {
    courses: state.sis.courses.courses,
    error: state.sis.courses.error,
    loggedIn: state.settings.token.valid,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateCourses: f => dispatch(updateCourses(f)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CoursesView)

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
})
