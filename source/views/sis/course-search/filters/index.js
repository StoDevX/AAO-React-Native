// @flow

import React from 'react'
import {ScrollView, Text, TouchableOpacity} from 'react-native'
import type {TopLevelViewPropsType} from '../../../types'
import {ConnectedCollapsibleList as CollapsibleList} from '../../components/collapsible-list'
import type {ReduxState} from '../../../flux'
import {connect} from 'react-redux'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	validGEs: string[],
}

type ReduxDispatchProps = {

}

type Props = ReactProps &
	ReduxStateProps &
	ReduxDispatchProps & {
		navigation: {state: {params: {}}},
	}

class CourseSearchFiltersView extends React.PureComponent<Props> {

  static navigationOptions = {
    title: "Add Filters",
  }

  render() {
		const {validGEs} = this.props
    return (
      <ScrollView>
        <CollapsibleList data={validGEs} title="GEs" />
				<CollapsibleList data={['AMST', 'CSCI']} title="Departments" />
      </ScrollView>
    )
  }
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		validGEs: state.sis ? state.sis.validGEs : [],
	}
}

export const ConnectedCourseSearchFiltersView = connect(mapState)(CourseSearchFiltersView)
