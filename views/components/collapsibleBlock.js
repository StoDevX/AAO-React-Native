/**
 * All About Olaf
 * Individual row for inside a collapsible view
 */

import React from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'

import Collapsible from 'react-native-collapsible'


let styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  collapsedContent: {
    alignSelf: 'center',

  },
  collapsedContainer: {
  },
})


export default class CollapsibleBlock extends React.Component {

  static propTypes = {
    children: React.PropTypes.array.isRequired,
    collapsedStyle: React.PropTypes.object.isRequired,
  }

  state = {
    isCollapsed: true,
  }

  render() {
    return (
        <TouchableOpacity
          onPress={() => this.setState({isCollapsed: !this.state.isCollapsed})}
        >
          {this.props.children[0]}
          <Collapsible collapsed={this.state.isCollapsed} style={[styles.collapsedContent, this.props.collapsedStyle]}>
            <View style={styles.collapsedContainer}>
              {this.props.children[1]}
            </View>
          </Collapsible>
        </TouchableOpacity>
    )
  }
}
