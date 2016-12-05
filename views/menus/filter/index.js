// @flow
import React from 'react'
import {ScrollView, Text, Switch} from 'react-native'

import {TableView, Section, Cell, CustomCell} from 'react-native-tableview-simple'

import type {FilterSpecType} from './types'
import fromPairs from 'lodash/fromPairs'
import values from 'lodash/values'
import includes from 'lodash/includes'
import difference from 'lodash/difference'
import union from 'lodash/union'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'

function SingleToggleSection({header, footer, label, value, onChange}: {header?: string, footer?: string, label: string, value: bool, onChange: () => any}) {
  return (
    <Section header={header} footer={footer}>
      <CustomCell>
        <Text style={{flex: 1, fontSize: 16}}>{label}</Text>
        <Switch value={value} onValueChange={onChange} />
      </CustomCell>
    </Section>
  )
}

function ChecklistSection({header, footer, options, onChange, value}: {header?: string, footer?: string, options: string[], onChange: () => any, value: string[]}) {
  function callback(tappedValue) {
    let result = value

    // we default to all items selected
    if (includes(value, tappedValue)) {
      // therefore, if the user has tapped an item, and it's already in the list of things they've tapped,
      // we want to _remove_ it from that list.
      result = difference(value, [tappedValue])
    } else {
      // otherwise, we need to add it to the list
      result = union(value, [tappedValue])
    }

    onChange(result)
  }

  return (
    <Section header={header} footer={footer}>
      {options.map(val =>
        <Cell
          key={val}
          onPress={() => callback(val)}
          accessory={includes(value, val) ? '' : 'Checkmark'}
          title={val}
        />)}
    </Section>
  )
}

function FilterView({sections, onFilterChanged}: {sections: FilterSpecType[], onFilterChanged: (filter: FilterSpecType, val: any) => any}) {
  return (
    <TableView>
      {sections.map(info =>
        info.type === 'toggle'
          ? <SingleToggleSection key={info.key} header={info.title} footer={info.caption} label={info.label} value={info.value} onChange={newVal => onFilterChanged(info, newVal)} />
          : <ChecklistSection key={info.key} header={info.title} footer={info.caption} options={info.options} value={info.value} onChange={newVal => onFilterChanged(info, newVal)} />
      )}
    </TableView>
  )
}


type MenusFilterViewPropsType = {
  filters: Array<FilterSpecType>,
  onChange: (x: FilterSpecType[]) => any,
};

export class MenusFilterView extends React.Component {
  static propTypes = {
    filters: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired,
  }

  state: {[key: string]: FilterSpecType} = {}

  componentWillMount() {
    this.init(this.props.filters)
  }

  componentWillReceiveProps(newProps: MenusFilterViewPropsType) {
    this.init(newProps.filters)
  }

  init(filterSpecs: FilterSpecType[]) {
    // console.log(filterSpecs)
    // We take the filter specs and turn them into a key-value mapping for
    // easier value updates
    this.setState(fromPairs(filterSpecs.map(spec => [spec.key, spec])))
  }

  props: MenusFilterViewPropsType;

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
