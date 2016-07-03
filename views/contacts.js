/**
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import Button from 'react-native-button'; // the button
import Communications from 'react-native-communications'; // the phone call functions
import {
  Card,
  CardImage,
  CardTitle,
  CardContent,
  CardAction
} from 'react-native-card-view'; // this relies on the exoernal card library

import NavigatorScreen from './components/navigator-screen'
import ContactCard from './components/contactCard'

export default class ContactView extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="Contact"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <ContactCard title='St. Olaf Public Safety' text='test' phoneNumber='123' buttonText='button' />
      <ContactCard title='' text='' phoneNumber='' buttonText='' />
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
