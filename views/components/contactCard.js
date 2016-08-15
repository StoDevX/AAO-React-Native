import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import Button from 'react-native-button' // the button
import Communications from 'react-native-communications' // the phone call functions

import NavigatorScreen from './navigator-screen'
import * as c from './colors'

let styles = StyleSheet.create({
  container: {
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: c.white,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: c.denim,
    width: 200,
    color: c.white,
    alignSelf: 'center',
    height: 30,
    paddingTop: 3,
    marginBottom: 10,
    borderRadius: 6,
  },
  content: {
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
})

export default class ContactCard extends React.Component {
  render() {
    console.log(this.props.title)
    console.log(this.props.phoneNumber)
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{this.props.title}</Text>
        <Text style={styles.content}>{this.props.text}</Text>
        <Button
          onPress={() => Communications.phonecall(this.props.phoneNumber, false)}
          style={styles.button}>
          {this.props.buttonText}</Button>
      </View>
    )
  }
}
