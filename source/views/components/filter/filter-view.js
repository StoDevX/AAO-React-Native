// @flow
import React from 'react'
import {ScrollView} from 'react-native'
import type {FilterType} from './types'
import {FilterSection} from './section'
import {TableView} from 'react-native-tableview-simple'
import {connect} from 'react-redux'
import get from 'lodash/get'

type PropsType = {
  pathToFilters: string[],
  filters: FilterType[],
  onChange: (x: FilterType[]) => any,
};

export function FilterViewComponent(props: PropsType) {
  const onFilterChanged = (filter: FilterType) => {
    // replace the changed filter in the array, maintaining position
    let result = props.filters.map(f => f.key !== filter.key ? f : filter)
    props.onChange(result)
  }

  const contents = props.filters.map(filter =>
    <FilterSection
      key={filter.key}
      filter={filter}
      onChange={onFilterChanged}
    />)

  return (
    <ScrollView style={{flex: 1}}>
      <TableView>
        {contents}
      </TableView>
    </ScrollView>
  )
}

const mapStateToProps = (state, actualProps) => {
  return {
    filters: get(state, actualProps.pathToFilters, []),
  }
}

export const FilterView = connect(mapStateToProps)(FilterViewComponent)
