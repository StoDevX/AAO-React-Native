// @flow
import React from 'react'
import {View, TextInput, StyleSheet} from 'react-native'
import {Toolbar, ToolbarButton} from '../components/toolbar'
import type {TopLevelViewPropsType} from '../types'
import {BonAppHostedMenu} from './menu-bonapp'

const styles = StyleSheet.create({
  default: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
})

export class BonAppPickerView extends React.Component {
  state: {
    cafeId: string,
    menu: ?any,
  } = {
    cafeId: '34',
    menu: null,
  }

  componentWillMount() {
    this.chooseMenu()
  }

  props: TopLevelViewPropsType;

  chooseCafe = (cafeId: string) => {
    if (!/^\d*$/.test(cafeId)) {
      return
    }
    this.setState({cafeId})
  }

  chooseMenu = () => {
    const menu = (
      <BonAppHostedMenu
        route={this.props.route}
        navigator={this.props.navigator}
        cafeId={this.state.cafeId}
        name='BonApp'
        loadingMessage={['Loading…']}
      />
    )
    this.setState({menu})
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <Toolbar onPress={this.chooseMenu}>
          <TextInput
            keyboardType='numeric'
            onChangeText={this.chooseCafe}
            value={this.state.cafeId}
            style={styles.default}
            onBlur={this.chooseMenu}
          />
          <ToolbarButton title='Go' isActive />
        </Toolbar>
        {this.state.menu}
      </View>
    )
  }
}
