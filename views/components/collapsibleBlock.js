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


export default class CollapsibleBlock extends React.Component {

  static propTypes = {
    backgroundColor: React.PropTypes.string.isRequired,
    children: React.PropTypes.array.isRequired,
  }

  state = {
    isCollapsed: true,
  }

  styles = StyleSheet.create({
    container: {
      marginBottom: 0,
    },
    collapsedContent: {
      alignSelf: 'center',

    },
    collapsedContainer: {
    },
  })

  render() {
    return (
        <TouchableOpacity
          onPress={() => this.setState({isCollapsed: !this.state.isCollapsed})}
        >
          {this.props.children[0]}
          <Collapsible collapsed={this.state.isCollapsed} style={[this.styles.collapsedContent, {backgroundColor: this.props.backgroundColor}]}>
            <View style={this.styles.collapsedContainer}>
              {this.props.children[1]}
            </View>
          </Collapsible>
        </TouchableOpacity>
    )
  }
}
