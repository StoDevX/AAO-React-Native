/**
 * All About Olaf
 * Navigator Screen component
 */

import React from 'react'
import {Navigator, StyleSheet, View} from 'react-native'

import BackButton from './back-button'
import ScreenTitle from './screen-title'

import * as c from './colors'

const MARGIN_TOP = 64
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: MARGIN_TOP,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: c.iosLightBackground,
  },

  navigationBar: {
    backgroundColor: c.white,
    borderBottomWidth: 1,
    borderBottomColor: c.iosNavbarBottomBorder,
  },
})

export default class NavigatorView extends React.Component {
  static propTypes = {
    leftButton: React.PropTypes.func,
    navigator: React.PropTypes.instanceOf(Navigator).isRequired,
    renderScene: React.PropTypes.func.isRequired,
    rightButton: React.PropTypes.func,
    title: React.PropTypes.string.isRequired,
  }

  static defaultProps = {
    leftButton(route, navigator) {
      return <BackButton navigator={navigator} route={route} />
    },
    rightButton() {
      return null
    },
  }

  render() {
    return (
      <Navigator
        navigator={this.props.navigator}
        navigationBar={
          <Navigator.NavigationBar
            style={styles.navigationBar}
            routeMapper={{
              LeftButton: route => this.props.leftButton(route, this.props.navigator),
              RightButton: route => this.props.rightButton(route, this.props.navigator),
              Title: () => <ScreenTitle>{this.props.title}</ScreenTitle>,
            }}
          />}
        renderScene={() =>
          <View style={styles.container}>
            {this.props.renderScene()}
          </View>}
      />
    )
  }
}
