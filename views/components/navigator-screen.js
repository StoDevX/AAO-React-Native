/**
 * All About Olaf
 * Navigator Screen component
 */

import React from 'react'
import {Navigator, StyleSheet, View} from 'react-native'

import BackButton from './back-button'
import ScreenTitle from './screen-title'

import * as c from './colors'

const MARGIN_TOP = 60
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
    renderScene: React.PropTypes.func.isRequired,
    title: React.PropTypes.string.isRequired,
    leftButton: React.PropTypes.func,
    rightButton: React.PropTypes.func,
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
        renderScene={this.renderScene.bind(this)}
        navigator={this.props.navigator}
        navigationBar={
          <Navigator.NavigationBar
            style={styles.navigationBar}
            routeMapper={{
              LeftButton: this.props.leftButton,
              RightButton: this.props.rightButton,
              Title: this.renderTitle.bind(this),
            }}
          />
        }
      />
    )
  }

  renderTitle() {
    return <ScreenTitle>{this.props.title}</ScreenTitle>
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        {this.props.renderScene()}
      </View>
    )
  }
}
