// @flow

import React from 'react'
import {ListView, Platform, RefreshControl} from 'react-native'
import isFunction from 'lodash/isFunction'

type DataType = Array<any> | {[key: string]: any};
type PropsType = {
  data: DataType,
  forceBottomInset?: boolean,
  children?: (any) => React$Component<*, *, *>,
  onRefresh?: () => any,
  refreshing?: boolean,
};

export default class SimpleListView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    }),
  }

  componentWillMount() {
    this.setup(this.props)
  }

  componentWillReceiveProps(nextProps: PropsType) {
    this.setup(nextProps)
  }

  props: PropsType;

  setup = (props: PropsType) => {
    this.setState(state => ({
      dataSource: this.cloneDatasource(state.dataSource, props.data),
    }))
  }

  cloneDatasource(dataSource: ListView.DataSource, data: DataType) {
    return Array.isArray(data)
      ? dataSource.cloneWithRows(data)
      : dataSource.cloneWithRowsAndSections(data)
  }

  render() {
    const renderRow = this.props.children
    if (!renderRow || !isFunction(renderRow)) {
      throw new Error('SimpleListView requires a function as the child')
    }

    const iosInset = this.props.forceBottomInset && Platform.OS === 'ios'
      ? {
        automaticallyAdjustContentInsets: false,
        contentInset: {bottom: 49},
      }
      : {}

    const refresher = this.props.onRefresh && 'refreshing' in this.props
      ? {
        refreshControl: (
          <RefreshControl
            onRefresh={this.props.onRefresh}
            refreshing={this.props.refreshing}
          />
        ),
      }
      : {}

    return (
      <ListView
        {...iosInset}
        {...refresher}
        initialListSize={6}
        pageSize={6}
        removeClippedSubviews={false}
        dataSource={this.state.dataSource}
        renderRow={rowData => renderRow(rowData)}
        {...this.props}
      />
    )
  }
}
