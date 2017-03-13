// @flow
import React from 'react'
import {StyleSheet, Platform, Dimensions} from 'react-native'
import {TabViewAnimated, TabBar} from 'react-native-tab-view'
import * as c from '../colors'
import type {TabbedViewPropsType} from './types'
import {tracker} from '../../../analytics'
import {style as defaultStyles} from './styles'

const styles = StyleSheet.create({
  tabbar: {
    height: 48,
    backgroundColor: c.mandarin,
  },
  indicator: {
    backgroundColor: c.androidTabAccentColor,
  },
  label: {
    color: c.white,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    fontWeight: '400',
  },
})

export default class TabbedView extends React.Component {
  state = {
    index: 0,
  };

  componentWillMount() {
    this._handleChangeTab(0)
  }

  props: TabbedViewPropsType;

  _handleChangeTab = index => {
    tracker.trackScreenView(this.props.tabs[index].id)
    this.setState({index})
  };

  _renderHeader = props => {
    return (
      <TabBar
        {...props}
        // TabBar renders the tabs to fill the width of the window
        // when scrollEnabled is false
        scrollEnabled={this.props.tabs.length > 3}
        indicatorStyle={styles.indicator}
        style={styles.tabbar}
        labelStyle={styles.label}
      />
    )
  };

  _renderScene = ({route}) => {
    const thisTabIndex = this.props.tabs.findIndex(tab => tab.id === route.id)
    if (Math.abs(this.state.index - thisTabIndex) > 2) {
      return null
    }

    return route.component()
  };

  render() {
    // see react-native-tab-view's readme for the rationale
    const initialLayout = {
      height: 0,
      width: Dimensions.get('window').width,
    }

    let routes = {routes: this.props.tabs.map(tab => ({...tab, key: tab.id}))}

    return (
      <TabViewAnimated
        style={[defaultStyles.container, this.props.style]}
        initialLayout={initialLayout}
        navigationState={{...this.state, ...routes}}
        renderScene={this._renderScene}
        renderHeader={this._renderHeader}
        onRequestChangeTab={this._handleChangeTab}
      />
    )
  }
}
