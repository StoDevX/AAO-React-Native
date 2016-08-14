/**
 * All About Olaf
 * Individual row for inside a collapsible view
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native'

import * as c from '../components/colors'
import Collapsible from 'react-native-collapsible'
import MenuItem from './menuItem'

let width = Dimensions.get('window').width; //full width

var styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  collapsedConetent: {
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
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 5,
    fontStyle: 'italic',
  },
  collapsedContainer: {
    marginBottom: 5,
  },
})

export default class MenuSection extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isCollapsed: true,
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => this.setState({isCollapsed: !this.state.isCollapsed})}>
            <Text style={styles.headerText}>{this.props.header}</Text>
            <Collapsible collapsed={this.state.isCollapsed} style={styles.collapsedConetent}>
              <View style={styles.collapsedContainer}>
                <Text style={styles.contentText}>{this.props.subText}</Text>
                <MenuItem items={this.props.content} />
              </View>
            </Collapsible>
        </TouchableOpacity>
      </View>
    )
  }
}
