import React from 'react'
import {Text, View, StyleSheet, TouchableOpacity} from 'react-native'
import {CourseType, parseTerm} from '../../../lib/course-search'
import {Cell, TableView, Section} from 'react-native-tableview-simple'
import {FormattedLine} from './formatted-line'

type Props = {
  terms: Array<{title: string, data: Array<CourseType>}>,
}

export default class CourseSearchTableView extends React.PureComponent<Props,State> {

  onPress = (course: CourseType) => {
    this.props.navigation.navigate('CourseDetailView', {course: course})
  }

  renderCells = (term) => {
    const cells = term.data.map((course) =>
      <TouchableOpacity
        key={course.clbid}
        onPress={() => {this.onPress(course)}}
      >
        <CourseCell
          course={course}
        />
      </TouchableOpacity>
    )
    return cells
  }

  renderSection = (term) => {
    let cells = this.renderCells(term)
    let termHeader = parseTerm(term.title)
    return (
      <Section
        header={termHeader}
        key={term.title}
      >
        {cells}
      </Section>
    )
  }

  render() {
    // console.log(this.props.terms)
    const sections = this.props.terms.map(term =>
      this.renderSection(term)
    )
    return (
      <TableView>

        {sections}

      </TableView>
    )
  }
}

const CourseCell = (props) => {
  return (
    <Cell
      {...props}
      key={props.key}
      cellContentView={
        <View style={styles.cellContainer}>
          <Text style={styles.cellHeader}>{props.course.name}</Text>
          <Text style={styles.cellSubTitle}>{props.course.departments[0]} {props.course.number}{props.course.section}</Text>
          <Text>{props.course.times && <FormattedLine items={props.course.times} />}</Text>
          <Text>{props.course.instructors && <FormattedLine items={props.course.instructors} />}</Text>
          <Text>{props.course.gereqs && <FormattedLine items={props.course.gereqs} />}</Text>
        </View>
      }
    />
  )


}

const styles = StyleSheet.create({
  cellContainer: {
    padding: 5,
  },
  cellHeader: {
    fontSize: 25,
  },
  cellSubTitle: {
    fontSize: 18,
  },
})
