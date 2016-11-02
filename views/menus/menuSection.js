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
import Collapsible from 'react-native-collapsible'
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
  contentText: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 5,
    fontStyle: 'italic',
  },
  headerBox: {
    // marginBottom: 5,
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
    content: MenuItemType[],
    header: string,
    subText: string,
  }

  render() {
    return (
      <TouchableOpacity
        onPress={() => this.setState({isCollapsed: !this.state.isCollapsed})}
        style={styles.container}
      >
        <View style={styles.headerBox}>
          <Text style={styles.headerText}>{this.props.header}</Text>
        </View>
        <Collapsible collapsed={this.state.isCollapsed} style={styles.collapsedContent}>
          <View style={styles.collapsedContainer}>
            <Text style={styles.contentText}>{this.props.subText}</Text>
            <MenuItem items={this.props.content} />
          </View>
        </Collapsible>
      </TouchableOpacity>
    )
  }
}
