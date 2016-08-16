// @flow

import React from 'react'
import {TabBarIOS} from 'react-native'

import styles from './styles'
import type { TabbedViewPropsType } from './types'
import { TabbedViewPropTypes } from './types'

export default class TabbedView extends React.Component {
  static propTypes = TabbedViewPropTypes;

  state = {
    selectedTab: this.props.tabs[0].id,
  }

  props: TabbedViewPropsType;

  render() {
    let tabs = this.props.tabs
    return (
      <TabBarIOS tintColor='orange' style={[styles.container, this.props.style]}>
        {tabs.map(tab =>
          <TabBarIOS.Item
            key={tab.id}
            icon={tab.icon}
            title={tab.title}
            selected={this.state.selectedTab === tab.id}
            translucent={true}
            onPress={() => this.setState({selectedTab: tab.id})}
          >
            <tab.content {...this.props.childProps} {...tab.props} />
          </TabBarIOS.Item>
        )}
      </TabBarIOS>
    )
  }
}
