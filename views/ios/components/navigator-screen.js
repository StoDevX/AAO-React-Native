/**
 * All About Olaf
 * iOS Menus page
 */
'use strict'

const React = require('react')
const RN = require('react-native')
const {Navigator, StyleSheet, View} = RN

const BackButton = require('./back-button')
const ScreenTitle = require('./screen-title')

class NavigatorView extends React.Component {
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

NavigatorView.propTypes = {
  renderScene: React.PropTypes.func.isRequired,
  title: React.PropTypes.string.isRequired,
  leftButton: React.PropTypes.func,
  rightButton: React.PropTypes.func,
}

NavigatorView.defaultProps = {
  leftButton(route, navigator) {
    return <BackButton navigator={navigator} route={route} />
  },
  rightButton() {
    return null
  },
}


// Device info
let MARGIN_TOP = 60
let styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    marginTop: MARGIN_TOP,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Navigation bar styling
  navigationBar: {
    backgroundColor: 'orange',
  },
})

module.exports = NavigatorView
