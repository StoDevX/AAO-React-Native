// @flow

import React from 'react'
import { TabBarIOS } from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'

import styles from './styles'
import type { TabbedViewPropsType } from './types'
import { TabbedViewPropTypes } from './types'

export default class TabbedView extends React.Component {
  static propTypes = TabbedViewPropTypes;

  state = {
    selectedTab: this.props.tabs[0].id,
  }

  props: TabbedViewPropsType;

  render() {
    let tabs = this.props.tabs
    console.log(tabs.map(t => t.rnVectorIcon))
    return (
      <TabBarIOS tintColor='orange' style={[styles.container, this.props.style]}>
        {tabs.map(tab =>
          <Icon.TabBarItemIOS
            key={tab.id}
            // apply either the vector icon, a given raster (base64) icon, or nothing.
            {...(tab.rnVectorIcon || tab.rnRasterIcon || {})}
            title={tab.title}
            style={styles.listViewStyle}
            selected={this.state.selectedTab === tab.id}
            translucent={true}
            onPress={() => this.setState({selectedTab: tab.id})}
          >
            <tab.content {...this.props.childProps} {...tab.props} />
          </Icon.TabBarItemIOS>
        )}
      </TabBarIOS>
    )
  }
}
