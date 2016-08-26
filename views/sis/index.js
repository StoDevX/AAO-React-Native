// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Navigator,
} from 'react-native'

import TabbedView from '../components/tabbed-view'
import Button from 'react-native-button'
import tabs from './tabs'
import LoadingView from '../components/loading'
import {isLoggedIn} from '../../lib/login'
import * as c from '../components/colors'
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  error: {
    marginTop: 50,
    marginLeft: 20,
    marginRight: 20,
  },
  errorButton: {
    backgroundColor: c.denim,
    width: 200,
    color: c.white,
    alignSelf: 'center',
    height: 30,
    paddingTop: 3,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
})

export default class SISView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator).isRequired,
    route: React.PropTypes.object.isRequired,
  }

  state = {
    loggedIn: false,
    loaded: false,
  };

  componentWillMount() {
    this.load()
  }

  load = async () => {
    let loggedIn = await isLoggedIn()
    this.setState({loggedIn})
  }

  render() {
    let {navigator, route} = this.props

    if (!this.state.loaded) {
      return <LoadingView />
    }

    // Check if the user has a valid username and password
    if (this.state.loggedIn) {
      return <TabbedView style={styles.container} tabs={tabs} />
    }

    return (
      <View style={styles.error}>
        <Text>Sorry, we couldn't find your login credentials. Did you set them up in the settings?</Text>
        <Button
          onPress={() =>
            navigator.push({
              id: 'SettingsView',
              index: route.index + 1,
              title: 'Settings',
            })
          }
          style={styles.errorButton}
        >Open Settings</Button>
      </View>
    )
  }
}
