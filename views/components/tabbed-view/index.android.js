// @flow
import React from 'react'
import { StyleSheet, Platform, Dimensions } from 'react-native'
import { TabViewAnimated, TabBarTop } from 'react-native-tab-view'
import * as c from '../colors'
import type { TabbedViewPropsType } from './types'
import { TabbedViewPropTypes } from './types'
import {tracker} from '../../../analytics'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabbar: {
    height: 48,
    backgroundColor: c.mandarin,
  },
  indicator: {
    backgroundColor: '#ffeb3b',
  },
  label: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    fontWeight: '400',
  },
})

export default class TabbedView extends React.Component {
  static propTypes = TabbedViewPropTypes

  state = {
    index: 0,
  }

  props: TabbedViewPropsType

  _handleChangeTab = index => {
    tracker.trackScreenView(this.props.tabs[index].title)
    this.setState({
      index,
    })
  }

  _renderHeader = props => {
    if (this.props.tabs.length > 2) {
      return (
        <TabBarTop
          {...props}
          scrollEnabled={true}
          indicatorStyle={styles.indicator}
          style={styles.tabbar}
          labelStyle={styles.label}
        />
      )
    } else {
      return (
        <TabBarTop
          {...props}
          scrollEnabled={true}
          indicatorStyle={styles.indicator}
          style={styles.tabbar}
          labelStyle={styles.label}
          tabWidth={Dimensions.get('window').width / 2}
        />
      )
    }
  }

  _renderScene = ({ route }) => {
    if (!route.component) {
      return null
    }

    return (
      <route.component
        {...this.props.childProps}
        {...(route.props || {})}
        navigator={this.props.navigator}
        route={this.props.route}
      />
    )
  }

  render() {
    let routes = {routes: this.props.tabs.map(tab => ({...tab, key: tab.id}))}

    return (
      <TabViewAnimated
        style={styles.container}
        navigationState={{...this.state, ...routes}}
        renderScene={this._renderScene}
        renderHeader={this._renderHeader}
        onRequestChangeTab={this._handleChangeTab}
      />
    )
  }
}
