// @flow
/**
 * All About Olaf
 * Individual row for inside a collapsible view
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native'

import * as c from '../components/colors'
import Collapsible from '../components/collapsible'
import MenuItem from './menuItem'
import type { MenuItemType } from './types'

let width = Dimensions.get('window').width //full width

let styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  collapsedContent: {
    alignSelf: 'center',
    backgroundColor: c.paleGreen,
    margin: 0,
    width: width,
  },
  headerText: {
    fontSize: 18,
    textAlign: 'center',
  },
  contentBox: {
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
  contentText: {
    fontStyle: 'italic',
  },
  headerBox: {
    backgroundColor: c.iosListSectionHeader,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
})

export default class MenuSection extends React.Component {
  state = {
    isCollapsed: true,
  }

  props: {
    items: MenuItemType[],
    title: string,
    subtext: string,
  }

  toggleExpanded = () => {
    this.setState({isCollapsed: !this.state.isCollapsed})
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={() => this.toggleExpanded()}>
            <Text style={styles.headerText}>{this.props.title}</Text>
          </TouchableOpacity>
        </View>

        <Collapsible collapsed={this.state.isCollapsed} style={[styles.collapsedContent, styles.collapsedContainer]}>
          {this.props.subtext ? <Text style={[styles.contentBox, styles.contentText]}>{this.props.subtext}</Text> : null}
          <MenuItem style={[styles.contentBox]} items={this.props.items} />
        </Collapsible>
      </View>
    )
  }
}
