/**
 * All About Olaf
 * Individual row for inside a collapsible view
 */

import React from 'react'
import {
  View,
  TouchableOpacity,
} from 'react-native'

import Collapsible from 'react-native-collapsible'


export default class CollapsibleBlock extends React.Component {

  static propTypes = {
    borderColor: React.PropTypes.string.isRequired,
    children: React.PropTypes.array.isRequired,
  }

  state = {
    isCollapsed: true,
  }

  style() {
    return {
      container: {
        marginBottom: 0,
      },
      collapsedContent: {
        alignSelf: 'center',
        backgroundColor: this.statusColor(),
        
      },
      collapsedContainer: {
      },
    }
  }

  statusColor(){
    return this.props.borderColor
  }

  render() {
    return (
        <TouchableOpacity
          onPress={() => this.setState({isCollapsed: !this.state.isCollapsed})}
        >
          {this.props.children[0]}
          <Collapsible collapsed={this.state.isCollapsed} style={this.style().collapsedContent}>
            <View style={this.style().collapsedContainer}>
              {this.props.children[1]}
            </View>
          </Collapsible>
        </TouchableOpacity>
    )
  }
}
