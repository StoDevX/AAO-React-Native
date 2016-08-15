// @flow

import React from 'react'
import {
  View,
} from 'react-native'

import {TabLayout, Tab} from 'react-native-android-tablayout'

import styles from './styles'
import type { TabbedViewPropsType } from './types'

export default class TabbedView extends React.Component {
  state = {
    selectedTab: 0,
  }

  props: TabbedViewPropsType

  render() {
    let tabs = this.props.tabs
    let TabContents = tabs[this.state.selectedTab].content
    return (
      <View style={[styles.container, this.props.style]}>
        <TabLayout
          selectedTabIndicatorColor='darkslateblue'
          selectedTab={this.state.selectedTab}
          onTabSelected={e => this.setState({selectedTab: e.nativeEvent.position})}
        >
          {tabs.map(tab => <Tab key={tab.id} name={tab.title} />)}
        </TabLayout>
        <TabContents />
      </View>
    )
  }
}
