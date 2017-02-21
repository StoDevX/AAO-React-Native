// @flow

import React from 'react'
import {ListView, Platform} from 'react-native'

type PropsType = {
  data: Array<any> | {[key: string]: any},
  forceBottomInset?: boolean,
  children?: (any) => React$Component<*, *, *>,
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
    this.setState(state => {
      return Array.isArray(props.data)
        ? state.dataSource.cloneWithRows(props.data)
        : state.dataSource.cloneWithRowsAndSections(props.data)
    })
  }

  render() {
    const renderRow = this.props.children
    if (!renderRow) {
      throw new Error('SimpleListView requires a function as the child')
    }

    const iosInset = this.props.forceBottomInset && Platform.OS === 'ios'
      ? {
        automaticallyAdjustContentInsets: false,
        contentInset: {bottom: 49},
      }
      : {}

    return (
      <ListView
        initialListSize={6}
        pageSize={6}
        {...iosInset}
        removeClippedSubviews={false}
        dataSource={this.state.dataSource}
        renderRow={rowData => renderRow(rowData)}
        {...this.props}
      />
    )
  }
}
