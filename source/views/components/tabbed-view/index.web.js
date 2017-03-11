// @flow

import React from 'react'
import {View} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {tracker} from '../../../analytics'
import styles from './styles'
import type {TabbedViewPropsType} from './types'
import {TabbedViewPropTypes} from './types'
import * as c from '../../components/colors'

export default class TabbedView extends React.Component {
  static propTypes = TabbedViewPropTypes;

  state = {
    selectedTab: this.props.tabs[0].id,
  };

  componentWillMount() {
    this.onChangeTab(this.props.tabs[0].id)
  }

  props: TabbedViewPropsType;

  onChangeTab = (tabId: string) => {
    tracker.trackScreenView(tabId)
    this.setState({selectedTab: tabId})
  };

  render() {
    let {navigator, route, tabs} = this.props
    let baseProps = {navigator, route}
    return (
      <View style={[styles.container, {color: c.mandarin}, this.props.style]}>
        {tabs.map(tab => {
          let icon = {}
          if (tab.rnVectorIcon) {
            let name = tab.rnVectorIcon.iconName
            icon.iconName = `ios-${name}-outline`
            icon.selectedIconName = `ios-${name}`
          }
          return (
            <Icon
              key={tab.id}
              // apply either the vector icon, a given raster (base64) icon, or nothing.
              {...icon}
              title={tab.title}
              style={styles.listViewStyle}
              selected={this.state.selectedTab === tab.id}
              translucent={true}
              onPress={() => this.onChangeTab(tab.id)}
            >
              <tab.component
                {...this.props.childProps}
                {...tab.props || {}}
                {...baseProps}
              />
            </Icon>
          )
        })}
      </View>
    )
  }
}
