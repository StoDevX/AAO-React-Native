/**
 * All About Olaf
 * iOS SIS page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')
const NavigatorScreen = require('./components/navigator-screen')
const Keychain = require('react-native-keychain')

const {
  StyleSheet,
  Text,
  View,
  TextInput,
  AsyncStorage,
} = RN


const STORAGE_KEY = '@AllAboutOlaf:SIS'
const SISLoginSection = require('./sis/login')

class SISView extends React.Component {
  constructor() {
    super()
  }

  componentWillMount() {
    // Keychain.getGenericPassword()
    //   .then(credentials => {
    //     this.setState({isLoggedIn: Boolean(credentials)})
    //   })
    //   .catch(err => console.error(err))
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="SIS"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <SISLoginSection />
      </View>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

module.exports = SISView
