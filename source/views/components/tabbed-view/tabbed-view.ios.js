// @flow

import React, {Children} from 'react'
import {TabBarIOS} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {tracker} from '../../../analytics'
import {styles} from './styles'
import type {TabbedViewPropsType, TabPropsType} from './types'
import * as c from '../../components/colors'

export class TabbedView extends React.Component {
  state: {selectedTab: string};

  componentWillMount() {
    const childrenAsArray = Children.toArray(this.props.children)
    this.onChangeTab(childrenAsArray[0].props.id)
  }

  props: TabbedViewPropsType;

  onChangeTab = (tabId: string) => {
    tracker.trackScreenView(tabId)
    this.setState({selectedTab: tabId})
  };

  render() {
    return (
      <TabBarIOS
        tintColor={c.mandarin}
        style={[styles.container, this.props.style]}
      >
        {Children.map(this.props.children, ({props: tab}) => (
          <TabBarItem
            tab={tab}
            onChangeTab={this.onChangeTab}
            isSelected={this.state.selectedTab === tab.id}
          />
        ))}
      </TabBarIOS>
    )
  }
}

class TabBarItem extends React.Component {
  props: {
    tab: TabPropsType,
    isSelected: boolean,
    onChangeTab: (id: string) => any,
  };

  onChangeTab = () => {
    this.props.onChangeTab(this.props.tab.id)
  };

  render() {
    const {tab} = this.props

    const icon = tab.icon
      ? {
          iconName: `ios-${tab.icon}-outline`,
          selectedIconName: `ios-${tab.icon}`,
        }
      : {}

    return (
      <Icon.TabBarItemIOS
        {...icon}
        key={tab.id}
        title={tab.title}
        style={styles.listViewStyle}
        selected={this.props.isSelected}
        translucent={true}
        onPress={this.onChangeTab}
      >
        {tab.render()}
      </Icon.TabBarItemIOS>
    )
  }
}
