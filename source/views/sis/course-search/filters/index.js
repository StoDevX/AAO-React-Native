// @flow

import React from 'react'
import {View, Text, TouchableOpacity} from 'react-native'
import type {TopLevelViewPropsType} from '../../../types'
import {CollapsibleList} from '../../components/collapsible-list'

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {course: CourseType}}},
}

export class CourseSearchFiltersView extends React.PureComponent<Props> {

  static navigationOptions = {
    title: "Add Filters",
  }

  render() {
    return (
      <View>
        <CollapsibleList title="GEs" />
      </View>
    )
  }
}
