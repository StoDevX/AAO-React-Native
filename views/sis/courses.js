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
import {Column} from '../components/layout'
import {ListRow, ListSeparator, ListSectionHeader, Detail, Title} from '../components/list'
import LoadingScreen from '../components/loading'
import {NoticeView} from '../components/notice'
import type {CourseType, CoursesByTermType} from '../../lib/courses'
import type {TopLevelViewPropsType} from '../types'
import {updateCourses} from '../../flux/parts/sis'

type CoursesViewPropsType = TopLevelViewPropsType & {
  error: null,
  loggedIn: true,
  updateCourses: (force: boolean) => {},
  coursesByTerm: CoursesByTermType,
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

  componentWillMount() {
    this.updateListview(this.props.coursesByTerm)
  }

  componentWillReceiveProps(nextProps: CoursesViewPropsType) {
    this.updateListview(nextProps.coursesByTerm)
  }

  props: CoursesViewPropsType;

  updateListview(coursesByTerm) {
    this.setState({dataSource: this.state.dataSource.cloneWithRowsAndSections(coursesByTerm)})
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({loading: true})

    await this.props.updateCourses(true)

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    await delay(500 - elapsed)

    this.setState({loading: false})
  }

  renderRow = (course: CourseType) => {
    return (
      <ListRow style={styles.rowContainer}>
        <Column>
          <Title>{course.name}</Title>
          <Detail>{course.deptnum}</Detail>
          {course.instructors ? <Detail>{course.instructors}</Detail> : null}
        </Column>
      </ListRow>
    )
  }

  renderSectionHeader = (courses: CourseType[], term: string) => {
    return <ListSectionHeader style={styles.rowSectionHeader} title={term} />
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} style={styles.separator} />
  }

  render() {
    if (this.props.error) {
      return <NoticeView text={'Error: ' + this.props.error.message} />
    }

    if (!this.props.loggedIn) {
      return (
        <NoticeView
          text='Sorry, it looks like your SIS session timed out. Could you set up the Google login in Settings?'
          buttonText='Open Settings'
          onPress={() =>
            this.props.navigator.push({
              id: 'SettingsView',
              title: 'Settings',
              index: this.props.route.index + 1,
              onDismiss: (route, navigator) => navigator.pop(),
              sceneConfig: 'fromBottom',
            })
          }
        />
      )
    }

    if (this.state.loading) {
      return <LoadingScreen />
    }

    if (!this.state.dataSource.getRowCount()) {
      return <NoticeView text='No courses found.' buttonText='Try again?' onPress={this.refresh} />
    }

    return (
      <ListView
        style={styles.listContainer}
        automaticallyAdjustContentInsets={false}
        contentInset={{bottom: Platform.OS === 'ios' ? 49 : 0}}
        dataSource={this.state.dataSource}
        renderRow={this.renderRow}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        removeClippedSubviews={false}
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
    coursesByTerm: state.sis.courses,
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
