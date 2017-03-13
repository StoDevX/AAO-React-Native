// @flow
import React from 'react'
import {StyleSheet, Platform, Dimensions} from 'react-native'
import {TabViewAnimated, TabBar} from 'react-native-tab-view'
import {styles as defaultStyles} from './styles'
import * as c from '../colors'
import type {TabbedViewPropsType} from './types'
import {tracker} from '../../../analytics'

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

export class TabbedView extends React.Component {
  state: {index: number};

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

  _renderScene = ({route}: any) => {
    const thisTabIndex = this.props.tabs.findIndex(tab => tab.id === route.id)
    if (Math.abs(this.state.index - thisTabIndex) > 2) {
      return null
    }

    return route.render()
  };

  render() {
    // see react-native-tab-view's readme for the rationale
    const initialLayout = {
      height: 0,
      width: Dimensions.get('window').width,
    }

    const navState = {
      ...this.state,
      routes: this.props.tabs.filter(Boolean).map(tab => ({...tab, key: tab.id})),
    }

    return (
      <TabViewAnimated
        style={[defaultStyles.container, this.props.style]}
        initialLayout={initialLayout}
        navigationState={navState}
        renderScene={this._renderScene}
        renderHeader={this._renderHeader}
        onRequestChangeTab={this._handleChangeTab}
      />
    )
  }
}
