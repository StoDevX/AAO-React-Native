/**
 * @flow
 * All About Olaf
 * Courses page
 */

import React from 'react'
import {StyleSheet} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import {connect} from 'react-redux'
import delay from 'delay'
import size from 'lodash/size'
import * as c from '../components/colors'
import SimpleListView from '../components/listview'
import {Column} from '../components/layout'
import {
  ListRow,
  ListSeparator,
  ListSectionHeader,
  Detail,
  Title,
} from '../components/list'
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
}

class CoursesView extends React.Component {
  static navigationOptions = {
    tabBarLabel: 'Courses',
    tabBarIcon: TabBarIcon('archive'),
  }

  state: {
    loading: boolean,
  } = {
    loading: false,
  }

  props: CoursesViewPropsType

  refresh = async () => {
    let start = Date.now()
    this.setState({loading: true})

    await this.props.updateCourses(true)

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    await delay(500 - elapsed)

    this.setState({loading: false})
  }

  renderSectionHeader = (courses: CourseType[], term: string) => {
    return <ListSectionHeader title={term} />
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} />
  }

  render() {
    if (this.props.error) {
      return <NoticeView text={'Error: ' + this.props.error.message} />
    }

    if (!this.props.loggedIn) {
      return (
        <NoticeView
          text="Sorry, it looks like your SIS session timed out. Could you set up the Google login in Settings?"
          buttonText="Open Settings"
          onPress={() => this.props.navigation.navigate('SettingsView')}
        />
      )
    }

    if (this.state.loading) {
      return <LoadingScreen />
    }

    if (!size(this.props.coursesByTerm)) {
      return (
        <NoticeView
          text="No courses found."
          buttonText="Try again?"
          onPress={this.refresh}
        />
      )
    }

    return (
      <SimpleListView
        style={styles.listContainer}
        data={this.props.coursesByTerm}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshing={this.state.loading}
        onRefresh={this.refresh}
      >
        {(course: CourseType) =>
          <ListRow>
            <Column>
              <Title>{course.name}</Title>
              <Detail>{course.deptnum}</Detail>
              {course.instructors
                ? <Detail>{course.instructors}</Detail>
                : null}
            </Column>
          </ListRow>}}
      </SimpleListView>
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
    backgroundColor: c.white,
  },
})
