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
  TouchableHighlight,
  RefreshControl,
} from 'react-native'
import * as c from '../components/colors'

import zip from 'lodash/zip'
import type {CourseType} from '../../lib/courses'
import {loadAllCourses} from '../../lib/courses'
import LoadingScreen from '../components/loading'

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
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this.rowHasChanged,
      sectionHeaderHasChanged: this.sectionHeaderHasChanged,
    }),
    loading: true,
    error: null,
  }

  componentWillMount() {
    this.fetchData()
  }

  onRefresh = () => {
    this.fetchData(true)
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

  async fetchData(forceFromServer?: bool) {
    try {
      let courses = await loadAllCourses(forceFromServer)
      this.setState({dataSource: this.state.dataSource.cloneWithRowsAndSections(courses)})
    } catch (error) {
      this.setState({error})
      console.error(error)
    }
    this.setState({loading: false})
  }

  renderRow = (course: CourseType|Error) => {
    if (course instanceof Error) {
      return (
        <TouchableHighlight underlayColor={'#ebebeb'}>
          <View style={styles.rowContainer}>
            <Text style={styles.itemTitle}>Error: {course.message}</Text>
          </View>
        </TouchableHighlight>
      )
    }
    let locationTimePairs = zip(course.locations, course.times)
    let deptnum = `${course.department.join('/')} ${course.number}` + (course.section || '')
    return (
      <TouchableHighlight underlayColor={'#ebebeb'}>
        <View style={styles.rowContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>{course.name}</Text>
          <Text style={styles.itemPreview} numberOfLines={2}>{deptnum}</Text>
          {locationTimePairs.map(([place, time], i) =>
            <Text key={i} style={styles.itemPreview} numberOfLines={1}>{place}: {time}</Text>)}
        </View>
      </TouchableHighlight>
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

  render() {
    if (this.state.error) {
      return <Text>Error: {this.state.error.message}</Text>
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
        pageSize={5}
        refreshControl={
          <RefreshControl
            refreshing={this.state.loading}
            onRefresh={this.onRefresh}
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
  rowContainer: {
    marginLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  itemTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
    textAlign: 'left',
  },
  rowSectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
})
