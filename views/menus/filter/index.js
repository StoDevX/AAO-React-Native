// @flow
import React from 'react'
import {ScrollView} from 'react-native'
import type {FilterSpecType} from './types'
import fromPairs from 'lodash/fromPairs'
import values from 'lodash/values'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'
import {FilterView} from './filter'

type MenusFilterViewPropsType = {
  filters: Array<FilterSpecType>,
  onChange: (x: FilterSpecType[]) => any,
};

export class MenusFilterView extends React.Component {
  state: {[key: string]: FilterSpecType} = {}

  componentWillMount() {
    this.init(this.props.filters)
  }

  componentWillReceiveProps(newProps: MenusFilterViewPropsType) {
    this.init(newProps.filters)
  }

  props: MenusFilterViewPropsType;

  init(filterSpecs: FilterSpecType[]) {
    // console.log(filterSpecs)
    // We take the filter specs and turn them into a key-value mapping for
    // easier value updates
    this.setState(fromPairs(filterSpecs.map(spec => [spec.key, spec])))
  }

  onFilterChanged = (filter: FilterSpecType, newValue: any) => {
    // need to clone `state` because `set` mutates and returns the same object
    this.setState(state => {
      let newState = set(cloneDeep(state), [filter.key, 'value'], newValue)
      this.props.onChange(values(newState))
      return newState
    })
  }

  render() {
    return (
      <ScrollView style={{flex: 1}}>
        <FilterView
          onFilterChanged={this.onFilterChanged}
          sections={values(this.state)}
        />
      </ScrollView>
    )
  }
}
