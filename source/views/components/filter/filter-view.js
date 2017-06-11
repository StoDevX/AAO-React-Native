// @flow
import React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import type {FilterType} from './types'
import {FilterSection} from './section'
import {TableView} from 'react-native-tableview-simple'
import {connect} from 'react-redux'
import get from 'lodash/get'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

type PropsType = {
  navigation: {
    state: {
      params: {
        pathToFilters: string[],
        filters: FilterType[],
        onChange: (x: FilterType[]) => any,
      },
    },
  },
}

export function FilterViewComponent(props: PropsType) {
  const {filters, onChange} = props.navigation.state.params

  const onFilterChanged = (filter: FilterType) => {
    // replace the changed filter in the array, maintaining position
    let result = filters.map(f => (f.key !== filter.key ? f : filter))
    onChange(result)
  }

  const contents = filters.map(filter =>
    <FilterSection
      key={filter.key}
      filter={filter}
      onChange={onFilterChanged}
    />,
  )

  return (
    <ScrollView style={styles.container}>
      <TableView>
        {contents}
      </TableView>
    </ScrollView>
  )
}

const mapStateToProps = (state, actualProps) => {
  return {
    filters: get(state, actualProps.navigation.state.params.pathToFilters, []),
  }
}

export const FilterView = connect(mapStateToProps)(FilterViewComponent)
