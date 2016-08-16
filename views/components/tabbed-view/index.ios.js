// @flow

import React from 'react'
import {View, TabBarIOS} from 'react-native'

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
      <View style={[styles.container, this.props.style]}>
        <TabBarIOS
          tintColor='orange'
        >
          {tabs.map(tab =>
            <TabBarIOS.Item
              key={tab.id}
              icon={tab.icon}
              title={tab.title}
              selected={this.state.selectedTab === tab.id}
              onPress={() => this.setState({selectedTab: tab.id})}
            >
              <tab.content {...tab.props} />
            </TabBarIOS.Item>)}
        </TabBarIOS>
      </View>
    )
  }
}
