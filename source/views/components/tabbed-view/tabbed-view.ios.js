// @flow

import React, {Children} from 'react'
import {TabBarIOS} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {tracker} from '../../../analytics'
import styles from './styles'
import type {TabbedViewPropsType} from './types'
import * as c from '../../components/colors'

export class TabbedView extends React.Component {
  state = {
    selectedTab: this.props.tabs[0].id,
  };

  componentWillMount() {
    this.onChangeTab(this.props.tabs[0].id)
  };

  props: TabbedViewPropsType;

  onChangeTab = (tabId: string) => {
    tracker.trackScreenView(tabId)
    this.setState({selectedTab: tabId})
  };

  render() {
    return (
      <TabBarIOS tintColor={c.mandarin} style={[styles.container, this.props.style]}>
        {Children.map(this.props.children, ({props}) => {
          const icon = props.icon
            ? {
              iconName: `ios-${props.icon}-outline`,
              selectedIconName: `ios-${props.icon}`,
            }
            : {}

          return (
            <Icon.TabBarItemIOS
              {...icon}
              key={props.id}
              title={props.title}
              style={styles.listViewStyle}
              selected={this.state.selectedTab === props.id}
              translucent={true}
              onPress={() => this.onChangeTab(props.id)}
            >
              {props.children()}
            </Icon.TabBarItemIOS>
          )
        })}
      </TabBarIOS>
    )
  }
}
