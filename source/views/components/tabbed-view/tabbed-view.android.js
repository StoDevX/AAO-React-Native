// @flow
import React, {Children} from 'react'
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
    const childrenAsArray = Children.toArray(this.props.children)
    tracker.trackScreenView(childrenAsArray[index].props.title)
    this.setState({index})
  };

  _renderHeader = props => {
    const tabStyle = Children.count(this.props.children) <= 2
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
  };

  _renderScene = ({route}: any) => {
    if (!route.children) {
      return null
    }

    return route.children()
  };

  render() {
    const navState = {
      ...this.state,
      routes: Children.map(this.props.children, ({props}) => ({
        ...props,
        key: props.id,
      })),
    }

    return (
      <TabViewAnimated
        style={[defaultStyles.container, this.props.style]}
        navigationState={navState}
        renderScene={this._renderScene}
        renderHeader={this._renderHeader}
        onRequestChangeTab={this._handleChangeTab}
      />
    )
  }
}
