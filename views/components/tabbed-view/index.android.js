// @flow

import React from 'react'
import {View} from 'react-native'
import {TabLayout, Tab} from 'react-native-android-tablayout'

import styles from './styles'
import type { TabbedViewPropsType } from './types'
import { TabbedViewPropTypes } from './types'

export default class TabbedView extends React.Component {
  static propTypes = TabbedViewPropTypes

  state = {
    selectedTabIndex: 0,
  }

  props: TabbedViewPropsType;

  render() {
    let tabs = this.props.tabs
    let TabInfo = tabs[this.state.selectedTabIndex]
    return (
      <View style={[styles.container, this.props.style]}>
        <TabLayout
          selectedTabIndicatorColor='orange'
          selectedTab={this.state.selectedTabIndex}
          onTabSelected={e => this.setState({selectedTabIndex: e.nativeEvent.position})}
        >
          {tabs.map(tab => <Tab key={tab.id} name={tab.title} />)}
        </TabLayout>
        <TabInfo.content {...this.props.childProps} {...TabInfo.props} />
      </View>
    )
  }
}
