// @flow
import React from 'react'
import {StyleSheet, Platform, Dimensions} from 'react-native'
import {TabViewAnimated, TabBar} from 'react-native-tab-view'
import * as c from '../colors'
import type { TabbedViewPropsType } from './types'
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
  state = {
    index: 0,
  }

  componentWillMount() {
    this._handleChangeTab(0)
  }

  props: TabbedViewPropsType

  _handleChangeTab = index => {
    tracker.trackScreenView(this.props.tabs[index].id)
    this.setState({
      index,
    })
  }

  _renderHeader = props => {
    const tabStyle = this.props.tabs.length <= 2
      ? {width: Dimensions.get('window').width / 2}
      : undefined

    return (
      <TabBar
        {...props}
        scrollEnabled={true}
        indicatorStyle={[styles.indicator]}
        style={styles.tabbar}
        labelStyle={styles.label}
        tabStyle={tabStyle}
      />
    )
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
