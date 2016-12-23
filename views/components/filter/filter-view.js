// @flow
import React from 'react'
import {ScrollView} from 'react-native'
import type {FilterSpecType} from './types'
import {FilterSection} from './section'
import {TableView} from 'react-native-tableview-simple'
import {connect} from 'react-redux'
import get from 'lodash/get'

type PropsType = {
  pathToFilters: string[],
  filters: FilterSpecType[],
  onChange: (x: FilterSpecType[]) => any,
};

class FilterViewComponent extends React.Component {
  props: PropsType;

  onFilterChanged = (filter: FilterSpecType) => {
    // replace the changed filter in the array, maintaining position
    let result = this.props.filters.map(f => f.key !== filter.key ? f : filter)
    this.props.onChange(result)
  };

  render() {
    const contents = this.props.filters.map(filter =>
      <FilterSection
        key={filter.key}
        filter={filter}
        onChange={this.onFilterChanged}
      />)

    return (
      <ScrollView style={{flex: 1}}>
        <TableView>
          {contents}
        </TableView>
      </ScrollView>
    )
  }
}

const mapStateToProps = (state, actualProps) => {
  return {
    filters: get(state, actualProps.pathToFilters, []),
  }
}

export const FilterView = connect(mapStateToProps)(FilterViewComponent)
