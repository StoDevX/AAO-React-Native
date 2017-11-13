// @flow
import React from 'react'
import {View, TextInput, StyleSheet} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'
import {Toolbar, ToolbarButton} from '../components/toolbar'
import type {TopLevelViewPropsType} from '../types'
import {BonAppHostedMenu} from './menu-bonapp'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  default: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: c.black,
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
})

type Props = TopLevelViewPropsType

type State = {
  cafeId: string,
  menu: ?any,
}

export class BonAppPickerView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    tabBarLabel: 'BonApp',
    tabBarIcon: TabBarIcon('ionic'),
  }

  state = {
    cafeId: '34',
    menu: null,
  }

  componentWillMount() {
    this.chooseMenu()
  }

  chooseCafe = (cafeId: string) => {
    if (!/^\d*$/.test(cafeId)) {
      return
    }
    this.setState({cafeId})
  }

  chooseMenu = () => {
    const menu = (
      <BonAppHostedMenu
        navigation={this.props.navigation}
        cafeId={this.state.cafeId}
        name="BonApp"
        loadingMessage={['Loading…']}
      />
    )
    this.setState({menu})
  }

  render() {
    return (
      <View style={styles.container}>
        <Toolbar onPress={this.chooseMenu}>
          <TextInput
            keyboardType="numeric"
            onChangeText={this.chooseCafe}
            value={this.state.cafeId}
            style={styles.default}
            onBlur={this.chooseMenu}
          />
          <ToolbarButton title="Go" isActive={true} />
        </Toolbar>
        {this.state.menu}
      </View>
    )
  }
}
