/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  AsyncStorage,
} from 'react-native'
import NavigatorScreen from '../components/navigator-screen'
import Keychain from 'react-native-keychain'
import SISLoginSection from './login'

const STORAGE_KEY = '@AllAboutOlaf:SIS'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

export default class SISView extends React.Component {
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
