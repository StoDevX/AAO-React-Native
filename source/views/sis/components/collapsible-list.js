// @flow

import React from 'react'
import {Text, View, StyleSheet, TouchableOpacity, Platform} from 'react-native'
import Collapsible from 'react-native-collapsible'
import * as c from '../../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'

type Props = {
  title: string,
}

type State = {
  collapsed: boolean,
}

export class CollapsibleList extends React.PureComponent<Props, State> {

  state = {
    collapsed: true,
  }

  onPress = () => {
    if (this.state.collapsed) {
      this.setState(() => ({collapsed: false}))
    } else {
      this.setState(() => ({collapsed: true}))
    }
  }

  render() {
    const {title} = this.props
    const {collapsed} = this.state
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.onPress} style={styles.headerContainer} >
          <Text style={styles.title}>{title}</Text>
          {renderIcon('arrow-down')}
        </TouchableOpacity>
        <Collapsible collapsed={collapsed} >
          <Text>TEST</Text>
        </Collapsible>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {

  },

  title: {
    fontSize: 30,
  },

  headerContainer: {
    backgroundColor: c.white,
    padding: 25,
  },

  icon: {
    fontSize: 30,
  },
})

const renderIcon = (name: string) => {
  const iconPlatform = Platform.OS === 'ios' ? 'ios' : 'md'
  return (<Icon name={`${iconPlatform}-${name}`} style={styles.icon} />)
}
