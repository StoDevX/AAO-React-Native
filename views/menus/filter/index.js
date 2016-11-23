// @flow
import React from 'react'
import {ScrollView, View, Text, Switch} from 'react-native'

import {TableView, Section, Cell, CustomCell} from 'react-native-tableview-simple'

import type {FilterSpecType} from './types'
import fromPairs from 'lodash/fromPairs'
import set from 'lodash/set'
import identity from 'lodash/identity'

function ToggleRow({label, value}: {label: string, value: bool}) {
  return (
    <CustomCell>
      <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
      <Switch value={value} />
    </CustomCell>
  )
}

function FilterView({sections, onFilterChanged}: {sections: FilterSpecType[], onFilterChanged: (filter: FilterSpecType, val: any) => any}) {
  return (
    <TableView>
      {sections.map(info =>
        <Section key={info.key} header={info.title} footer={info.caption}>
          {info.type === 'toggle'
            ? <ToggleRow label={info.label} value={false} onChange={newVal => onFilterChanged(info, newVal)} />
            : info.options.map(val =>
              <Cell key={val} title={val} />)}
        </Section>
      )}
    </TableView>
  )
}


type MenusFilterViewPropsType = {
  categories: Array<FilterSpecType>,
  onChange: (x: FilterSpecType) => any,
};

export class MenusFilterView extends React.Component {
  static propTypes = {
  }

  state: {
    filters: {[key: string]: FilterSpecType},
  } = {
    filters: {},
  }

  componentWillMount() {
    this.init(this.props.categories)
  }

  componentWillRecieveProps(newProps: MenusFilterViewPropsType) {
    this.init(newProps.categories)
  }

  init(filterSpecs: FilterSpecType[]) {
    this.setState({filters: fromPairs(filterSpecs.map(spec => {
      if (spec.type === 'boolean') {
        return [spec.key, {type: spec.type, key: spec.key, value: false}]
      } else if (spec.type === 'list') {
        return [spec.key, {type: spec.type, key: spec.key, booleanKind: spec.booleanKind, values: []}]
      }
      return null
    }).filter(identity))})
  }

  props: MenusFilterViewPropsType;

  onFilterChanged = (filter: FilterSpecType, newValue: any) => {
    this.setState(state => {
      return set(state, ['filters', filter.key, 'value'], newValue)
    })
  }

  render() {
    return (
      <ScrollView style={{flex: 1}}>
        <FilterView onFilterChanged={this.onFilterChanged} sections={this.props.categories} />
      </ScrollView>
    )
  }
}
